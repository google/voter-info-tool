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
 * @fileoverview Wrapper for the Google Civic Information Api.
 * @author jmwaura@google.com (Jesse Mwaura)
 */

goog.provide('vit.api.Autocomplete');

goog.require('goog.string.path');
goog.require('vit.api.Api');



/**
 * Create a wrapper for the Places AutoCompletion API.
 * @param {vit.context.Context} context The application context.
 * @constructor
 * @extends {vit.api.Api}
 */
vit.api.Autocomplete = function(context) {
  goog.base(this);

  /**
   * The application context context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;

  /**
   * The application context context.
   * @type {boolean}
   * @private
   */
  this.canMakeRequest_ = true;

  /**
   * The application context context.
   * @type {google.maps.places.AutocompleteService}
   * @private
   */
  this.autocompleteService_ = new google.maps.places.AutocompleteService();
};
goog.inherits(vit.api.Autocomplete, vit.api.Api);


/**
 * Look up address suggestions. This method throttles requests and
 * should therefore not be expected to always call the callback function.
 * @param {!string} address The address for which to fetch voter info.
 * @param {function(Array.<?vit.api.Autocomplete.Prediction>,
 *     google.maps.places.PlacesServiceStatus)} callback
 *     The function to call when the request completes.
 */
vit.api.Autocomplete.prototype.autocomplete = function(address, callback) {
  if (! this.canMakeRequest_) {
    // Simply drop request if last one was too recent.
    return;
  }
  this.canMakeRequest_ = false;
  setTimeout(goog.bind(function() {
    this.canMakeRequest_ = true;
  }, this), vit.api.Autocomplete.REQUEST_INTERVAL);
  // TODO(jmwaura): The api doesn't seem to do a great job of biasing these
  // based on client location. Add bounds param.
  var params = {
    'input': address,
    'types': ['geocode'],
    'componentRestrictions': {'country': 'us'}
  };
  var responseTransformer = goog.bind(function(callback, predictions, status) {
    callback(this.transformResponse_(predictions), status);
  }, this, callback);
  this.autocompleteService_.getPlacePredictions(params, responseTransformer);
};


/**
 * Transform raw object into Response.
 * @param {Array.<Object>} predictions Raw object to transform.
 * @return {Array.<vit.api.Autocomplete.Prediction>} Transformed object.
 * @private
 */
vit.api.Autocomplete.prototype.transformResponse_ = function(predictions) {
  if (!goog.isDefAndNotNull(predictions)) {
    return null;
  }

  var len = predictions.length;
  /** @type {Array.<?vit.api.Autocomplete.Prediction>} */
  var predictionsArray = [];
  for (var i = 0; i < len; i++) {
    predictionsArray[i] = this.transformPrediction_(
        predictions[i]);
  }

  return predictionsArray;
};


/**
 * Transform raw object into Prediction.
 * @param {Object} obj Raw object to transform.
 * @return {?vit.api.Autocomplete.Prediction} Transformed object.
 * @private
 */
vit.api.Autocomplete.prototype.transformPrediction_ = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return null;
  }

  var out = {description: obj['description']};
  return /** @type {vit.api.Autocomplete.Prediction} */ (out);
};


/**
 * Type definition for Autocomplete Prediction.
 * @typedef {{
 *   description: string
 * }}
 */
vit.api.Autocomplete.Prediction;

/**
 * The minimum interval in ms between queries to the autocomplete API.
 * @type {number}
 */
vit.api.Autocomplete.REQUEST_INTERVAL = 100;
