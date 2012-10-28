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
 * @fileoverview Simplified interface for Distance Matrix service.
 * @author jmwaura@google.com (Jesse Mwaura)
 */

goog.provide('vit.api.Distance');


/**
 * Create a wrapper DistanceMatrix Service.
 * @constructor
 */
vit.api.Distance = function() {
  /**
   * An instance of the DistanceMatrixService class.
   * @type {google.maps.DistanceMatrixService}
   * @private
   */
  this.service_ = new google.maps.DistanceMatrixService();
};
goog.addSingletonGetter(vit.api.Distance);


/**
 * Get distances from an origin to a set of addresses.
 * @param {string|google.maps.LatLng} origin Origin from which to get distances.
 * @param {Array.<string>|Array.<google.maps.LatLng>} destinations The
 *   destinations to which to get distances.
 * @param {function(Array.<google.maps.DistanceMatrixResponseElement>)}
 *   callback The function to call with the distances.
 */
vit.api.Distance.prototype.getDistances = function(origin, destinations,
    callback) {
  var responseArray = [];
  var requestArray = [];

  // Slice the destinations into MAX_DESTINATIONS size arrays.
  for (var i = 0; i < destinations.length;
      i += vit.api.Distance.MAX_DESTINATIONS) {
    var start = i;
    var end = Math.min(destinations.length,
        i + vit.api.Distance.MAX_DESTINATIONS);
    requestArray.push(destinations.slice(start, end));
  }
  var numRequests = requestArray.length;
  var responseCount = 0;
  for (var i = 0; i < numRequests; i++) {
    var request = {
      'origins': [origin],
      'destinations': requestArray[i],
      'travelMode': google.maps.TravelMode.DRIVING,
      'unitSystem': google.maps.UnitSystem.IMPERIAL,
      'avoidHighways': false,
      'avoidTolls': false
    };
    this.service_.getDistanceMatrix(request, goog.bind(
        function(i, response) {
          responseCount++;
          responseArray[i] = response;
          if (responseCount >= numRequests) {
            callback(this.processResponses_(responseArray));
          }
        }, this, i));
  }
};


/**
 * Extracts the distance data from a list of responses.
 * @param {Array.<Object>} responseArray List of responses from the service.
 * @return {Array.<google.maps.DistanceMatrixResponseElement>} List of response
 *   elements from all responses.
 * @private
 */
vit.api.Distance.prototype.processResponses_ = function(responseArray) {
  var responseElements = [];
  for (var i = 0; i < responseArray.length; i++) {
    var response = responseArray[i];
    if (!response || !response['rows'] || !response['rows'].length) {
      return null;
    }
    var elements = response['rows'][0]['elements'];
    if (goog.isArray(elements)) {
      goog.array.extend(responseElements, elements);
    } else {
      return null;
    }
  }
  return responseElements;
};


/**
 * The maximum number of destinations to pass to the DistanceMatrix service.
 * @const
 */
vit.api.Distance.MAX_DESTINATIONS = 25;
