/**
 * Copyright 2012 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Main entry point for the Voter Information Tool.
 *
 * @author jmwaura@google.com (Jesse Mwaura)
 */

goog.provide('vit');
goog.provide('vit.Base');

goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.locale');
goog.require('goog.net.jsloader');
goog.require('vit.agent.Autocomplete');
goog.require('vit.agent.CivicInfo');
goog.require('vit.agent.Xpc');
goog.require('vit.analytics.Analytics');
goog.require('vit.component.Component');
goog.require('vit.component.Page');
goog.require('vit.context');
goog.require('vit.context.Context');



/**
 * Module to manage all top level components.
 * @constructor
 * @extends {vit.context.Context}
 */
vit.Base = function() {
  goog.base(this);

  /**
   * The page component.
   * @type {vit.component.Page}
   * @private
   */
  this.pageComponent_;

  /**
   * Configuration object.
   * @type {Object.<string, *>}
   * @private
   */
  this.config_;

  /**
   * The xpc agent that handles communication between this page and the
   * VIT frame.
   * @type {vit.agent.Xpc}
   * @private
   */
  this.xpc_;

  /**
   * The timeout id for pending document change events.
   * @type {?number}
   * @private
   */
  this.documentChangeTimeout_;

  /**
   * The listener for document change events.
   * @type {?number}
   * @private
   */
  this.documentChangeListener_;

  /**
   * The listener for viewport size change events.
   * @type {?number}
   * @private
   */
  this.viewportSizeListener_;

  /**
   * The last recorded content height.
   * @type {?number}
   * @private
   */
  this.contentHeight_;
};
goog.inherits(vit.Base, vit.context.Context);


/**
 * Default configuration for the tool.
 * @const {Object}
 */
vit.Base.DEFAULT_CONFIG = {
  'election_id': '4000',
  'referrer': document.referrer
};


/**
 * Number of milliseconds to wait for configuration.
 * @const {number}
 */
vit.Base.CONFIG_TIMEOUT = 250;


/**
 * The interval in milliseconds to wait before reacting to a document change
 * event.
 * @const {number}
 */
vit.Base.DOCUMENT_CHANGE_DEBOUNCE_TIMEOUT = 100;


/**
 * Initialize VoterInfo. Install components and trigger initialization.
 * @return {vit.Base} This instance.
 */
vit.Base.prototype.init = function() {
  // Track the page view immediately.
  vit.analytics.Analytics.getInstance().trackPageview();

  this.subscribe(vit.context.CONFIG, this.onConfig_, this);

  // Go ahead and start up with defaults after timeout elapses.
  var timeout = setTimeout(goog.bind(function() {
    this.set(vit.context.CONFIG, vit.Base.DEFAULT_CONFIG);
  },this), vit.Base.CONFIG_TIMEOUT);

  // Set up the xpc connection and listen for incoming configuration changes.
  var xpc = new vit.agent.Xpc();
  xpc.initInner();
  xpc.registerService(vit.agent.Xpc.Service.CONFIG,
      goog.bind(function(timeout, payload) {
        // We have our configuration. Disable the timeout.
        clearTimeout(timeout);
        if (goog.isDefAndNotNull(this.get(vit.context.CONFIG))) {
          // Configuration may only be set once. Ignore this.
          return;
        }

        // Extend the defaults with the incoming configuration.
        var config = {};
        goog.object.extend(config, vit.Base.DEFAULT_CONFIG,
            goog.json.parse(payload));
        this.set(vit.context.CONFIG, config);
      }, this, timeout));

  xpc.connect(goog.bind(function() {
    this.xpc_ = xpc;
    this.registerDisposable(this.xpc_);
  }, this));
  return this;
};


/**
 * Initialize components that are dependent on the page having loaded.
 * @param {!Object.<string,*>} config The new configuration.
 * @private
 */
vit.Base.prototype.onConfig_ = function(config) {
  if (this.config_) {
    throw new Error('Already configured.');
  }
  var uriList = [];
  // Load jsapi for the ClientLocation or skip if a region is configured.
  if (! goog.isDef(config[vit.context.REGION])) {
    uriList.push({uri: new goog.Uri('https://www.google.com/jsapi')});
  }

  // Load maps api.
  uriList.push({uri: new goog.Uri('https://maps.googleapis.com/maps/api/js')
      .setParameterValue('key', vit.api.API_KEY)
      .setParameterValue('sensor', 'false')
      .setParameterValue('libraries', 'places')
      .setParameterValue('v', '3.10')
      .setParameterValue('language',
          goog.locale.getLanguageSubTag(goog.LOCALE))});

  // load gapi client.
  uriList.push({
    uri: new goog.Uri('https://apis.google.com/js/client.js'),
    callbackParam: 'onload'
  });

  vit.util.load(uriList, goog.bind(this.onDepsLoaded_, this));

  // Load analytics. No need to wait until loaded, we'll use async calls anyway.
  goog.net.jsloader.load('https://ssl.google-analytics.com/ga.js');
};


/**
 * Initialize components that are dependent on the all the js having loaded.
 * @private
 */
vit.Base.prototype.onDepsLoaded_ = function() {
  var civicInfoAgent = new vit.agent.CivicInfo(this).init();
  this.registerDisposable(civicInfoAgent);
  var autocompleteAgent = new vit.agent.Autocomplete(this).init();
  this.registerDisposable(autocompleteAgent);
  var config = this.get(vit.context.CONFIG);
  if (config[vit.context.ConfigName.ADDRESS]) {
    this.set(vit.context.ADDRESS, config[vit.context.ConfigName.ADDRESS]);
  } else if (goog.isDef(config[vit.context.ConfigName.REGION])) {
    // Make sure region is not explicitly set to null.
    // This way we can distinguish between "please don't geocode" and
    // "I have no clue, you do it."
    if (config[vit.context.ConfigName.REGION]) {
      this.set(vit.context.REGION, config[vit.context.ConfigName.REGION]);
    }
  } else {
    if (google.loader.ClientLocation && google.loader.ClientLocation.address &&
        google.loader.ClientLocation.address.region &&
        google.loader.ClientLocation.address.country_code == 'US') {
      this.set(vit.context.REGION, google.loader.ClientLocation.address.region);
    }
  }
  this.decorate();
  this.set(vit.context.READY, true);
};


/**
 * Create components and attach to dom.
 */
vit.Base.prototype.decorate = function() {
  var pageComponent = new vit.component.Page(this);
  // Attach listener before rendering the page.
  this.documentChangeListener_ = goog.events.listen(pageComponent,
      vit.component.Component.EventType.DOCUMENT_CHANGE,
      goog.bind(this.onDocumentChange_, this));
  pageComponent.decorate(
      goog.dom.getElementByClass(goog.getCssName('base')));
  this.registerDisposable(pageComponent);

  var vsm = new goog.dom.ViewportSizeMonitor();
  this.registerDisposable(vsm);
  this.viewportSizeListener_ = goog.events.listen(vsm,
      goog.events.EventType.RESIZE,
      goog.bind(this.onDocumentChange_, this));
};


/**
 * Checks if client height has changed and publishes these changes over the xpc
 * channel.
 * @private
 */
vit.Base.prototype.onDebouncedDocumentChange_ = function() {
  if (! this.xpc_) {
    return;
  }
  this.documentChangeTimeout_ = null;
  var height = document.body.clientHeight;
  if (height != this.contentHeight_) {
    this.contentHeight_ = height;
    this.xpc_.send(vit.agent.Xpc.Service.RESIZE, '' + height);
  }
};


/**
 * Handles document change events.
 * @private
 */
vit.Base.prototype.onDocumentChange_ = function() {
  if (goog.isDefAndNotNull(this.documentChangeTimeout_)) {
    return;
  }
  this.documentChangeTimeout_ = setTimeout(
      goog.bind(this.onDebouncedDocumentChange_, this),
      vit.Base.DOCUMENT_CHANGE_DEBOUNCE_TIMEOUT);
};


/** @override */
vit.Base.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
};


/**
 * Main entry point for VoterInfo.
 * @return {vit.Base} New Base instance.
 * @private
 */
vit.init_ = function() {
  return new vit.Base().init();
};


goog.exportSymbol('vit.init', vit.init_);
