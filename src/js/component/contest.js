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
 * @fileoverview Component that manages the contest pane.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.Contest');

goog.require('goog.soy');
goog.require('goog.ui.Component');
goog.require('vit.component.ContestInfo');



/**
 * Create component that manages the contest pane.
 *
 * @param {vit.context.Context} context The application context.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {goog.ui.Component}
 * @constructor
 */
vit.component.Contest = function(context, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The application context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;

  /**
   * Component that handles rendering of contest info.
   * @type {vit.component.ContestInfo}
   * @private
   */
  this.contestInfo_;
};
goog.inherits(vit.component.Contest, goog.ui.Component);


/** @override */
vit.component.Contest.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);
  this.renderContestInfo_();
  var callback = goog.bind(this.handleCivicInfoChange_, this);
  this.context_.subscribe(vit.context.CIVIC_INFO, callback);
};


/**
 * Handle a civic info change.
 * @param {vit.api.CivicInfo.Response} civicInfo New civic info response.
 * @param {vit.api.CivicInfo.Response} oldCivicInfo Old civic info response.
 * @private
 */
vit.component.Contest.prototype.handleCivicInfoChange_ =
    function(civicInfo, oldCivicInfo) {
  if (civicInfo == oldCivicInfo) {
    return;
  }
  this.renderContestInfo_();
};

/**
 * Render the contest info pane.
 * @private
 */
vit.component.Contest.prototype.renderContestInfo_ = function() {
  if (this.contestInfo_) {
    this.removeChildren(true);
    this.contestInfo_.dispose();
  }
  this.contestInfo_ = new vit.component.ContestInfo(this.context_);
  this.registerDisposable(this.contestInfo_);
  this.addChild(this.contestInfo_, true);
};


/** @override */
vit.component.Contest.prototype.disposeInternal = function() {
  this.context_ = null;

  goog.base(this, 'disposeInternal');
};
