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
 * @fileoverview Component that handles the address input and polling pane.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.Polling');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('vit.component.AddressDialog');
goog.require('vit.component.Component');
goog.require('vit.component.PollingInfo');



/**
 * Component that handles rendering of polling location and address input.
 *
 * @param {vit.context.Context} context The application context.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {vit.component.Component}
 * @constructor
 */
vit.component.Polling = function(context, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The application context context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;
};
goog.inherits(vit.component.Polling, vit.component.Component);


/** @override */
vit.component.Polling.prototype.createDom = function() {
  this.decorateInternal(this.dom_.createElement('div'));
};


/**
 * Decorates a div by adding either the address dialog or the polling location
 * component.
 * @param {Element} element The DIV element to decorate.
 * @override
 */
vit.component.Polling.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);

  var callback = goog.bind(this.handleCivicInfoChange_, this);
  /**
   * The subscription ID for polling location changes.
   * @type {number}
   * @private
   */
  this.civicInfoSubscriptionId_ =
      this.context_.subscribe(vit.context.CIVIC_INFO, callback);
  this.updatePollingPane_();
};


/** @override */
vit.component.Polling.prototype.disposeInternal = function() {
  if (goog.isDefAndNotNull(this.pollingInfoSubscriptionId_)) {
    this.context_.unsubscribeById(this.pollingInfoSubscriptionId_);
  }
  this.context_ = null;

  goog.base(this, 'disposeInternal');
};


/**
 * Handle a polling location change by either showing the polling location
 * information or the address entry dialog. Only redraw the polling location
 * info if it has actually changed.
 * @param {?vit.api.CivicInfo.Response} civicInfo The new polling location info.
 * @param {?vit.api.CivicInfo.Response} oldCivicInfo The old polling location
 *     info.
 * @private
 */
vit.component.Polling.prototype.handleCivicInfoChange_ =
    function(civicInfo, oldCivicInfo) {
  this.updatePollingPane_();
};


/**
 * Update polling pane.
 * @private
 */
vit.component.Polling.prototype.updatePollingPane_ = function() {
  var civicInfo = /** @type vit.api.CivicInfo.Response */
      (this.context_.get(vit.context.CIVIC_INFO));
  if (civicInfo && (civicInfo.pollingLocations || civicInfo.earlyVoteSites)) {
    this.renderPollingInfo_();
  } else {
    this.renderAddressDialog_();
  }
};


/**
 * Add a PollingInfo child component.
 * @private
 */
vit.component.Polling.prototype.renderPollingInfo_ = function() {
  this.disposeChildren_(this.removeChildren(true));
  this.addChild(new vit.component.PollingInfo(this.context_), true);
  var changeButton = this.getElementByClass(
    goog.getCssName('change-address-link'));
  this.getHandler().listenOnce(changeButton, goog.events.EventType.CLICK,
      this.renderAddressDialog_);
};


/**
 * Add an AddressDialog child component.
 * @private
 */
vit.component.Polling.prototype.renderAddressDialog_ = function() {
  this.disposeChildren_(this.removeChildren(true));
  this.addChild(new vit.component.AddressDialog(this.context_), true);
};


/**
 * Dispose of both pollingInfo and addressDialog components.
 * @param {Array.<vit.component.Component>=} children Children to dispose.
 * @private
 */
vit.component.Polling.prototype.disposeChildren_ = function(children) {
  if (!children) {
    return;
  }
  goog.array.forEach(/** @type {Array.<vit.component.Component>} */ (children),
      function(child) {
        child.dispose();
      }
  );
};
