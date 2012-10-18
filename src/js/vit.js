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
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('vit.agent.Autocomplete');
goog.require('vit.agent.CivicInfo');
goog.require('vit.component.Alert');
goog.require('vit.component.Contest');
goog.require('vit.component.Leo');
goog.require('vit.component.Polling');
goog.require('vit.context');
goog.require('vit.context.Context');


/**
 * Main entry point for VoterInfo.
 * @return {vit.Base} New Base instance.
 * @private
 */
vit.init_ = function() {
  return new vit.Base().init();
};



/**
 * Module to manage all top level components.
 * @constructor
 * @extends {vit.context.Context}
 */
vit.Base = function() {
  goog.base(this);

  /**
   * Polling pane component.
   * @type {vit.component.Polling}
   * @private
   */
  this.pollingPane_;

  /**
   * Contest pane component.
   * @type {vit.component.Contest}
   * @private
   */
  this.contestPane_;

  /**
   * Configuration object.
   * @type {Object.<string, *>}
   * @private
   */
  this.config_;
};
goog.inherits(vit.Base, vit.context.Context);


/**
 * Initialize VoterInfo. Install components and trigger initialization.
 * @return {vit.Base} This instance.
 */
vit.Base.prototype.init = function() {
  this.subscribe(vit.context.CONFIG, this.onConfig_, this);
  // TODO(jmwaura): Handle configuration initialization properly.
  this.set(vit.context.CONFIG, {'election_id': '4000', 'official_only': false});
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
      .setParameterValue('v', '3.10')});

  // load gapi client.
  uriList.push({
    uri: new goog.Uri('https://apis.google.com/js/client.js'),
    callbackParam: 'onload'
  });

  vit.util.load(uriList, goog.bind(this.onDepsLoaded_, this));
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
  if (goog.isDef(config[vit.context.REGION])) {
    if (config[vit.context.REGION]) {
      this.set(vit.context.REGION, config[vit.context.REGION]);
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
  var pollingPane = new vit.component.Polling(this);
  pollingPane.decorate(
      goog.dom.getElementByClass(goog.getCssName('polling-pane')));
  this.registerDisposable(pollingPane);

  var contestPane = new vit.component.Contest(this);
  contestPane.decorate(
      goog.dom.getElementByClass(goog.getCssName('contest-pane')));
  this.registerDisposable(contestPane);

  var alert = new vit.component.Alert(this);
  alert.decorate(
      goog.dom.getElementByClass(goog.getCssName('alert-container')));
  this.registerDisposable(alert);

  var leo = new vit.component.Leo(this);
  leo.decorate(
      goog.dom.getElementByClass(goog.getCssName('leo-info-container')));
  this.registerDisposable(leo);
};


/** @override */
vit.Base.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
};


goog.exportSymbol('vit.init', vit.init_);
