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
 * @fileoverview A client wrapper for Google Analytics.
 * @author jasonbrooks@google.com (Jason Brooks)
 */

goog.provide('vit.analytics.Analytics');



/**
 * A thin client wrapper for Google Analytics.
 * @constructor
 */
vit.analytics.Analytics = function() {
  /**
   * The analytics command queue in the global scope.
   */
  _gaq = goog.global['_gaq'] || [];
  _gaq.push(['_setAccount', vit.analytics.Analytics.KEY]);
};
goog.addSingletonGetter(vit.analytics.Analytics);


/**
 * The analytics account key.
 * @define {string} Analytics account key.
 */
vit.analytics.Analytics.KEY = '';


/**
 * Tracks a page view.
 */
vit.analytics.Analytics.prototype.trackPageview = function() {
  _gaq.push(['_trackPageview']);
};


/**
 * Tracks an event.
 * @param {string} category The general event category (e.g. "Videos").
 * @param {string} action The action for the event (e.g. "Play").
 * @param {string} opt_label An optional descriptor for the event.
 * @param {number} opt_value An optional integer value associated with the
 *     event.
 * @param {boolean} opt_noninteraction Default value is false. By default, the
 *     event hit sent by trackEvent will impact a visitor's bounce rate. By
 *     setting this param to true, this event hit will not be used in bounce
 *     rate calculations.
 */
vit.analytics.Analytics.prototype.trackEvent = function(
  category, action, opt_label, opt_value, opt_noninteraction) {
  _gaq.push(['_trackEvent',
      category, action, opt_label, opt_value, opt_noninteraction]);
};

