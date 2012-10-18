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
 * @fileoverview Component that renders the polling location data.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.PollingInfo');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component');
goog.require('vit.api.StaticMap');
goog.require('vit.templates.pollingInfo');
goog.require('vit.util');



/**
 * Component that handles rendering of polling location information.
 *
 * @param {vit.context.Context} context The application context.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {goog.ui.Component}
 * @constructor
 */
vit.component.PollingInfo = function(context, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The application context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;
};
goog.inherits(vit.component.PollingInfo, goog.ui.Component);


/** @override */
vit.component.PollingInfo.prototype.createDom = function() {
  var data = this.formatData_();
  var element = goog.soy.renderAsElement(vit.templates.pollingInfo, data);
  this.setElementInternal(element);
};


/**
 * Formats API data for use in the template.
 * @return {Object.<string, *>} Object containing info to render.
 * @private
 */
vit.component.PollingInfo.prototype.formatData_ = function() {
  var civicInfo = /** @type vit.api.CivicInfo.Response */
      (this.context_.get(vit.context.CIVIC_INFO));
  var staticMapUrl;
  var directionsUrl;
  var mapUrl;
  if (civicInfo.pollingLocations && civicInfo.pollingLocations.length) {
    var pl = civicInfo.pollingLocations[0];
    staticMapUrl = this.getStaticMapUrl_(pl.address);
    directionsUrl = this.getDirectionsUrl_(civicInfo.normalizedInput,
        pl.address);
    mapUrl = this.getMapUrl_(pl.address);
  }
  return {
    pollingLocation: civicInfo.pollingLocations &&
        civicInfo.pollingLocations.length &&
        this.formatPollingLocation_(civicInfo.pollingLocations[0] || null),
    normalizedInput: this.formatAddress_(civicInfo.normalizedInput),
    staticMapUrl: staticMapUrl,
    directionsUrl: directionsUrl,
    mapUrl: mapUrl
  };
};


/**
 * Get a static map URL for a polling location.
 * @param {vit.api.CivicInfo.Address} address Polling location address
 *     for which to generate a URL.
 * @return {?string} Map URL.
 * @private
 */
vit.component.PollingInfo.prototype.getStaticMapUrl_ = function(address) {
  if (!address) {
    return null;
  }
  var addressString = vit.api.CivicInfo.addressToString(address, true, true);

  return vit.api.StaticMap.generateMapUrl(addressString, true, '150x100');
};


/**
 * Get a directions URL for a polling location.
 * @param {vit.api.CivicInfo.Address} from Address to use as start for
 *     directions.
 * @param {vit.api.CivicInfo.Address} to Polling location address to use as
 *     destination for directions.
 * @return {string} Map URL.
 * @private
 */
vit.component.PollingInfo.prototype.getDirectionsUrl_ = function(from, to) {
  var options = {
    'saddr': vit.api.CivicInfo.addressToString(from, true, true),
    'daddr': vit.api.CivicInfo.addressToString(to, true, true)
  };
  return new goog.Uri(vit.component.PollingInfo.MAPS_URL).setQueryData(
      goog.Uri.QueryData.createFromMap(options)).toString();
};


/**
 * Get a map URL for a polling location.
 * @param {vit.api.CivicInfo.Address} address Polling location address
 *     for which to generate a URL.
 * @return {string} Map URL.
 * @private
 */
vit.component.PollingInfo.prototype.getMapUrl_ = function(address) {
  var options = {
    'q': vit.api.CivicInfo.addressToString(address, true, true)
  };
  return new goog.Uri(vit.component.PollingInfo.MAPS_URL).setQueryData(
      goog.Uri.QueryData.createFromMap(options)).toString();
};


/**
 * Formats a pollingLocation for use in the template.
 * @param {vit.api.CivicInfo.PollingLocation} pollingLocation Polling location
 *   to format.
 * @return {vit.api.CivicInfo.PollingLocation} Formatted polling location.
 * @private
 */
vit.component.PollingInfo.prototype.formatPollingLocation_ =
    function(pollingLocation) {
  return /** @type {vit.api.CivicInfo.PollingLocation} */ ({
    address: pollingLocation.address &&
        this.formatAddress_(pollingLocation.address),
    pollingHours: pollingLocation.pollingHours
  });
};


/**
 * Formats an address for use in the template.
 * @param {vit.api.CivicInfo.Address} address Address to format.
 * @return {vit.api.CivicInfo.Address} Formatted address.
 * @private
 */
vit.component.PollingInfo.prototype.formatAddress_ = function(address) {
  return /** @type {vit.api.CivicInfo.Address} */ ({
    locationName: address.locationName &&
        vit.util.selectiveTitleCase(address.locationName),
    line1: address.line1 && vit.util.selectiveTitleCase(address.line1),
    line2: address.line2 && vit.util.selectiveTitleCase(address.line2),
    line3: address.line3 && vit.util.selectiveTitleCase(address.line3),
    city: address.city && vit.util.selectiveTitleCase(address.city),
    state: address.state && (address.state.length == 2) ?
        address.state.toUpperCase() : address.state,
    zip: address.zip
  });
};


/** @override */
vit.component.PollingInfo.prototype.disposeInternal = function() {
  this.context_ = null;

  goog.base(this, 'disposeInternal');
};


/**
 * Static map api URL.
 * @type {string}
 * @const
 */
vit.component.PollingInfo.MAPS_URL = 'https://maps.google.com/maps';
