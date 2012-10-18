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
 * @fileoverview Component that handles rendering of the region selector.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.RegionSelector');

goog.require('goog.Uri.QueryData');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component');
goog.require('vit.api');
goog.require('vit.api.StaticMap');
goog.require('vit.context');



/**
 * Component that handles rendering of the region selector.
 *
 * @param {vit.context.Context} context The application context.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {goog.ui.Component}
 * @constructor
 */
vit.component.RegionSelector = function(context, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The application context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;

  /**
   * The currently selected state.
   * @type {?string}
   * @private
   */
   this.currentRegion_ = null;
};
goog.inherits(vit.component.RegionSelector, goog.ui.Component);


/**
 * Decorates a region selector by adding handlers for user global
 * events.
 * @param {Element} element The DIV element to decorate.
 * @override
 */
vit.component.RegionSelector.prototype.decorateInternal =
    function(element) {
  goog.base(this, 'decorateInternal', element);

  var callback = goog.bind(this.updateRegion_, this);
  /** @type {number} */
  this.regionSubscription_ = this.context_.subscribe(vit.context.REGION,
    callback);
  this.updateRegion_(
    /** @type {string} */ (this.context_.get(vit.context.REGION))
  );
};


/**
 * Update display to show currently selected region.
 * @param {?string} region The currently selected region.
 * @private
 */
vit.component.RegionSelector.prototype.updateRegion_ = function(region) {
  /**
   * Default to the US.
   * TODO(jmwaura): Remove hard coded country, use configuration instead.
   */
  region = /** @type {string} */ (region) || 'US';

  /**
   * Check that region has changed.
   */
  if (region != this.currentRegion_) {
    this.currentRegion_ = region;
    goog.dom.removeChildren(this.element_);
    goog.dom.appendChild(this.element_,
        goog.dom.createDom(goog.dom.TagName.IMG,
        {src: vit.api.StaticMap.generateMapUrl(region)}));
  }
};


/** @override */
vit.component.RegionSelector.prototype.disposeInternal = function() {
  if (goog.isDefAndNotNull(this.regionSubscription_)) {
    this.context_.unsubscribeById(this.regionSubscription_);
  }
  this.context_ = null;

  goog.base(this, 'disposeInternal');
};
