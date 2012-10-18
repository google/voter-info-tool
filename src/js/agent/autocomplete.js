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
 * @fileoverview Agent to interface the Places Autocomplete API with the VIT
 * PubSub infrastructure.
 * @author jmwaura@google.com (Jesse Mwaura)
 */

goog.provide('vit.agent.Autocomplete');

goog.require('goog.Disposable');
goog.require('vit.api.Autocomplete');
goog.require('vit.context.Context');



/**
 * Construct Autocomplete agent.
 * @param {vit.context.Context} context The application context.
 * @constructor
 * @extends {goog.Disposable}
 */
vit.agent.Autocomplete = function(context) {
  goog.base(this);

  /**
   * The application context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;

  /**
   * The Autocomplete API.
   * @type {vit.api.Autocomplete
  }
   * @private
   */
  this.api_ = new vit.api.Autocomplete(context);
  this.registerDisposable(this.api_);

  /**
   * Subscription ID for textbox change notifications.
   * @type {?number}
   * @private
   */
  this.addressEntrySubscription_;

  /**
   * Suggestions from the api.
   * @type {Array.<string>}
   * @private
   */
  this.suggestions_ = [];

  /**
   * Lower case suggestions from the api. Stored in this form so that they're
   * not converted each time.
   * @type {Array.<string>}
   * @private
   */
  this.suggestionsLower_ = [];

  /**
   * Last failed prefix. If no suggestions were made for this prefix,
   * no api requests will be made for entries for which this is a prefix.
   * @type {?string}
   * @private
   */
  this.failedPrefix_;
};
goog.inherits(vit.agent.Autocomplete, goog.Disposable);


/**
 * Initialize this agent.
 * @return {vit.agent.Autocomplete
} return this agent.
 */
vit.agent.Autocomplete.prototype.init = function() {
  var addressEntryChangeHandler =
      goog.bind(this.handleAddressEntryChange_, this);

  this.addressEntrySubscription_ = this.context_.subscribe(
      vit.context.ADDRESS_ENTRY, addressEntryChangeHandler);

  return this;
};


/**
 * Handle a change in the address.
 * @param {?string} partialAddress New address. Expected to be a string.
 * @param {?string} oldAddress Old address. Expected to be a string.
 * @private
 */
vit.agent.Autocomplete.prototype.handleAddressEntryChange_ =
    function(partialAddress, oldAddress) {
  partialAddress = /** @type {string} */ (partialAddress) || '';
  oldAddress = /** @type {string} */ (oldAddress) || '';
  if (partialAddress == oldAddress ||
      (partialAddress && oldAddress.lastIndexOf(partialAddress, 0) == 0)) {
    return;
  }
  this.makeSuggestion_(partialAddress);
};


/**
 * Attempt to match address to available suggestions or get new ones.
 * @param {string} partialAddress Partial address for which to make suggestions.
 * @private
 * TODO(jmwaura): Consider moving some of this logic into the component to avoid
 *     the PubSub overhead.
 */
vit.agent.Autocomplete.prototype.makeSuggestion_ = function(partialAddress) {
  if (!partialAddress ||
      partialAddress.length < vit.agent.Autocomplete.MIN_CHARS) {
    this.context_.set(vit.context.ADDRESS_SUGGESTION, '');
    return;
  }
  var partialAddressLower = partialAddress.toLowerCase();
  var suggestionsLower = this.suggestionsLower_;
  var suggestionLength = suggestionsLower.length;
  for (var i = 0; i < suggestionLength; i++) {
    // not sure compiler will inline goog.string.startsWith
    if (suggestionsLower[i].lastIndexOf(partialAddressLower, 0) == 0) {
      var match = partialAddress +
          this.suggestions_[i].substring(partialAddress.length);
      this.context_.set(vit.context.ADDRESS_SUGGESTION, match);
      return;
    }
  }
  // Clear the suggestion.
  this.context_.set(vit.context.ADDRESS_SUGGESTION, '');

  if (partialAddressLower.lastIndexOf(this.failedPrefix_, 0) == 0) {
    return;
  }

  this.api_.autocomplete(partialAddress,
      goog.bind(this.handleApiResponse_, this, partialAddress));
};


/**
 * Make another attempt to match address to newly available suggestions.
 * @private
 */
vit.agent.Autocomplete.prototype.retrySuggestion_ = function() {
  var currentPartialAddress = /** @type {string} */
      (this.context_.get(vit.context.ADDRESS_ENTRY));
  this.makeSuggestion_(currentPartialAddress);
};


/**
 * Handle a response from the api in the address.
 * @param {string} partialAddress Partial address that triggered the request.
 * @param {Array.<?vit.api.Autocomplete.Prediction>} predictions Result object.
 * @param {google.maps.places.PlacesServiceStatus} status Response status.
 * @private
 */
vit.agent.Autocomplete.prototype.handleApiResponse_ =
    function(partialAddress, predictions, status) {
  if (status != google.maps.places.PlacesServiceStatus.OK) {
    this.failedPrefix_ = partialAddress;
    return; // Fail quietly.
  } else {
    var predictionList = [];
    var predictionListLower = [];
    var predictionLength = predictions.length;
    for (var i = 0; i < predictionLength; i++) {
      if (!(predictions[i] && predictions[i].description)) {
        continue;
      }
      var description = predictions[i].description;
      predictionList[i] = description;
      predictionListLower[i] = description.toLowerCase();
    }
    this.suggestions_ = predictionList;
    this.suggestionsLower_ = predictionListLower;
    this.retrySuggestion_();
  }
};

/**
 * @override
 */
vit.agent.Autocomplete.prototype.disposeInternal = function() {
  if (goog.isDefAndNotNull(this.addressEntrySubscription_)) {
    this.context_.unsubscribeById(this.addressEntrySubscription_);
  }
  this.suggestions_ = null;
  this.suggestionsLower_ = null;
  this.context_ = null;
  goog.base(this, 'disposeInternal');
};

/**
 * Minimum number of characters to call the API with.
 * @const
 */
vit.agent.Autocomplete.MIN_CHARS = 7;
