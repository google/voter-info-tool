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
 * @fileoverview Component that handles rendering of notices.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.Alert');

goog.require('goog.dom');
goog.require('goog.ui.Component');
goog.require('vit.context');
goog.require('vit.templates.alert');



/**
 * Component that handles rendering of the region selector.
 *
 * @param {vit.context.Context} context The application context.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {goog.ui.Component}
 * @constructor
 */
vit.component.Alert = function(context, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The application context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;

  /**
   * The notice subscription id.
   * @type {!number}
   * @private
   */
  this.subscriptionId_;
};
goog.inherits(vit.component.Alert, goog.ui.Component);


/** @override */
vit.component.Alert.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.subscriptionId_ = this.context_.subscribe(vit.context.NOTICE,
      this.handleNotice_, this);
};


/**
 * Handles a published notice by displaying an alert box.
 * @param {vit.context.Notice} notice The published notice.
 * @private
 */
vit.component.Alert.prototype.handleNotice_ = function(notice) {
  if (notice) {
    goog.soy.renderElement(this.getElement(), vit.templates.alert, notice);
  } else {
    goog.dom.removeChildren(this.getElement());
  }
};


/** @override */
vit.component.Alert.prototype.exitDocument = function() {
  if (goog.isDefAndNotNull(this.subscriptionId_)) {
    this.context_.unsubscribeById(this.subscriptionId_);
  }
  goog.base(this, 'exitDocument');
};


/** @override */
vit.component.Alert.prototype.disposeInternal = function() {
  this.context_ = null;
  goog.base(this, 'disposeInternal');
};
