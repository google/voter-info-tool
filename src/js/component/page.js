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
 * @fileoverview Top level component that acts as parent to all other VIT
 *   components.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.Page');

goog.require('vit.component.Alert');
goog.require('vit.component.Component');
goog.require('vit.component.Contest');
goog.require('vit.component.Leo');
goog.require('vit.component.Polling');



/**
 * Component that acts as a parent to all page components.
 *
 * @param {vit.context.Context} context The application context.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {vit.component.Component}
 * @constructor
 */
vit.component.Page = function(context, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The application context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;
};
goog.inherits(vit.component.Page, vit.component.Component);


/** @override */
vit.component.Page.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);

  var pollingPane = new vit.component.Polling(this.context_);
  this.addChild(pollingPane);
  pollingPane.decorate(
      goog.dom.getElementByClass(goog.getCssName('polling-pane')));

  var contestPane = new vit.component.Contest(this.context_);
  this.addChild(contestPane);
  contestPane.decorate(
      goog.dom.getElementByClass(goog.getCssName('contest-pane')));

  var alert = new vit.component.Alert(this.context_);
  this.addChild(alert);
  alert.decorate(
      goog.dom.getElementByClass(goog.getCssName('alert-container')));

  var leo = new vit.component.Leo(this.context_);
  this.addChild(leo);
  leo.decorate(
      goog.dom.getElementByClass(goog.getCssName('leo-info-container')));
};


/** @override */
vit.component.Page.prototype.disposeInternal = function() {
  this.context_ = null;

  goog.base(this, 'disposeInternal');
};
