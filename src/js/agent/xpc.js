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
 * @fileoverview Agent for cross-page communication.
 *
 * @author jmwaura@google.com (Jesse Mwaura)
 */

goog.provide('vit.agent.Xpc');

goog.require('goog.Disposable');
goog.require('goog.Uri');
goog.require('goog.debug.Logger');
goog.require('goog.json');
goog.require('goog.net.xpc.CrossPageChannel');



/**
 * Constructs an xpc agent.
 * @constructor
 * @extends goog.Disposable
 */
vit.agent.Xpc = function() {
  goog.base(this);

  /**
   * The xpc channel.
   * @type {goog.net.xpc.CrossPageChannel}
   * @private
   */
  this.channel_;
};
goog.inherits(vit.agent.Xpc, goog.Disposable);


/**
 * Services for communication between outer and inner.
 * @enum {string}
 */
vit.agent.Xpc.Service = {
  CONFIG: 'config',
  RESIZE: 'resize'
};


/**
 * Set up the channel as the outer frame.
 * @param {!string} peerUri URI to connect to as peer.
 * @param {!Element} containerEl Container element in which to create a frame.
 * @param {function(Element)=} opt_iframeCb Callback to set iframe properties.
 */
vit.agent.Xpc.prototype.initOuter =
    function(peerUri, containerEl, opt_iframeCb) {
  var cfg = {};
  cfg[goog.net.xpc.CfgFields.TRANSPORT] =
      goog.net.xpc.TransportTypes.NATIVE_MESSAGING;
  cfg[goog.net.xpc.CfgFields.PEER_URI] = peerUri;
  this.channel_ = new goog.net.xpc.CrossPageChannel(cfg);
  this.channel_.createPeerIframe(containerEl, opt_iframeCb);
};


/**
 * Set up the channel as an inner frame.
 * @return {boolean} Whether or not the channel was successfully set up.
 */
vit.agent.Xpc.prototype.initInner = function() {
  // Get the channel configuration from the url parameters.
  var xpc = (new goog.Uri(window.location.href)).getParameterValue('xpc');
  if (!xpc) {
    return false;
  }
  var cfg = goog.json.parse(xpc);
  this.channel_ = new goog.net.xpc.CrossPageChannel(cfg);
  return true;
};


/**
 * Make an xpc connection.
 * @param {function(!Object)=} opt_callback Function to call when connected.
 */
vit.agent.Xpc.prototype.connect = function(opt_callback) {
  if (this.channel_) {
    this.channel_.connect(opt_callback);
  }
};


/**
 * Register an xpc service.
 * @param {vit.agent.Xpc.Service} service Service to register.
 * @param {function((!Object | string))} handler Handler function for this
 *   service.
 */
vit.agent.Xpc.prototype.registerService = function(service, handler) {
  if (this.channel_) {
    this.channel_.registerService(service, handler);
  }
};


/**
 * Send a payload to an xpc service.
 * @param {vit.agent.Xpc.Service} service Service to register.
 * @param {(!Object | string)} payload Payload to send to service.
 */
vit.agent.Xpc.prototype.send = function(service, payload) {
  if (this.channel_) {
    this.channel_.send(service, payload);
  }
};


/**
 * @override
 */
vit.agent.Xpc.prototype.disposeInternal = function() {
  if (this.channel_) {
    this.channel_.dispose();
  }
  goog.base(this, 'disposeInternal');
};
