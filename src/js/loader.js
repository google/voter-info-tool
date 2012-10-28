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
 * @fileoverview Class that adds the Voter Information tool to an element
 *   on the page and manages configuration and sizing.
 *
 * @author jmwaura@google.com (Jesse Mwaura)
 */

goog.provide('vit.Loader');

goog.require('goog.Disposable');
goog.require('goog.Uri');
goog.require('goog.string');
goog.require('goog.style');
goog.require('vit.agent.Xpc');



/**
 * Constructs the Voter Information Tool loader class.
 * @constructor
 */
vit.Loader = function() {
  /**
   * The xpc agent that handles communication between this page and the
   * VIT frame.
   * @type {vit.agent.Xpc}
   * @private
   */
  this.xpc_;

  /**
   * The element inwhich to draw the tool.
   * @type {Element}
   * @private
   */
  this.el_;
};


/**
 * The url from which to load the Voter Information Tool
 * @define {string} Voter Information Tool URL.
 */
vit.Loader.TOOL_URL = '';


/**
 * Load the Voter Information Tool in the provided element.
 * @param {string} url The url of the page to load.
 * @param {!Object} config The configuration object to pass to the tool.
 * @param {!Element} el The element in which to draw the tool.
 */
vit.Loader.prototype.load = function(url, config, el) {
  if (!url) {
    throw new Error('No URL configured for Voter Information Tool');
  }
  if (!el || !(el instanceof Element)) {
    throw new Error('Invalid container element or none specified.');
  }

  var div = goog.dom.createElement('div');
  div.style.border = 'none';
  div.style.height = '450px';
  div.style.margin = '0';
  div.style.overflow = 'hidden';
  div.style.padding = '0';

  goog.dom.removeChildren(el);
  goog.dom.appendChild(el, div);
  this.el_ = div;
  this.xpc_ = new vit.agent.Xpc();
  this.xpc_.initOuter(url, this.el_, function(iframe) {
    iframe.setAttribute('scrolling', 'no');
    iframe.style.border = 'none';
    iframe.style.height = '100%';
    iframe.style.overflow = 'hidden';
    iframe.style.width = '100%';
  });
  this.xpc_.registerService(vit.agent.Xpc.Service.RESIZE,
      goog.bind(this.handleResize_, this));
  this.xpc_.connect(goog.bind(function(config) {
    this.xpc_.send(vit.agent.Xpc.Service.CONFIG, goog.json.serialize(config));
  }, this, config));
};


/**
 * Handle resize messages triggered by height changes in the tool.
 * @param {(!Object | string)} height New client height of the tool in pixels.
 * @private
 */
vit.Loader.prototype.handleResize_ = function(height) {
  if (! goog.isString(height)) {
    throw new Error('Height must be a string.');
  }
  if (goog.string.isNumeric(height)) {
    height = height + 'px';
  }
  goog.style.setHeight(this.el_, /** @type {string} */ (height));
};


/**
 * Main entry point for VIT Loader.
 * @param {Object=} opt_config Configuration object.
 * @param {Element|string=} opt_el Element in which to render the tool.
 * @return {vit.Loader} Loader instance.
 * @private
 */
vit.load_ = function(opt_config, opt_el) {
  var loader = new vit.Loader();
  var vitConfig = opt_config || {};
  var vitEl = /** @type {!Element} */ opt_el && goog.dom.getElement(opt_el) ||
      goog.dom.getElement('_vit');
  var vitUrl = vit.Loader.TOOL_URL;
  if (vitConfig['url']) {
    vitUrl = vitConfig['url'];
    delete vitConfig['url'];
  }
  vitConfig['referrer'] = window.location.href;
  loader.load(vitUrl, vitConfig, vitEl);
  return loader;
};

goog.exportSymbol('vit.load', vit.load_);
