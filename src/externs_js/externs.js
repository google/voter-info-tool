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
 * @fileoverview Declaration of external namespaces that must not be removed
 *     from compiled sources.
 * @externs
 * @author jmwaura@google.com (Jesse Mwaura)
 */


/**
 * The google namespace for the maps api and loader.
 * @suppress {duplicate}
 * @noalias
 */
var google = {};


/** @type {!Object} */
google.loader;


/** @type {!Object} */
google.loader.ClientLocation;


/** @type {!Object} */
google.loader.ClientLocation.address;


/** @type {string} */
google.loader.ClientLocation.address.region;


/** @type {string} */
google.loader.ClientLocation.address.country_code;


/** @type {!Object} */
google.maps;


/** @type {!Object} */
google.maps.places;


/**
 * Constructs AutocompleteService instance.
 * @constructor
 */
google.maps.places.AutocompleteService = function() {};


/**
 * Retrieves autocomplete predictions based on the request object.
 * @param {!Object} request The request object.
 * @param {!function(Array.<!Object>, google.maps.places.PlacesServiceStatus)}
 *     callback The function to call when the request completes.
 */
google.maps.places.AutocompleteService.prototype.getPlacePredictions =
    function(request, callback) {};


/**
 * Enumeration of PlacesService Status codes.
 * @enum {string}
 */
google.maps.places.PlacesServiceStatus = {};
google.maps.places.PlacesServiceStatus.OK;
google.maps.places.PlacesServiceStatus.ZERO_RESULTS;
google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT;
google.maps.places.PlacesServiceStatus.REQUEST_DENIED;
google.maps.places.PlacesServiceStatus.INVALID_REQUEST;



/**
 * The main namespace for the Google API client.
 * @suppress {duplicate}
 * @noalias
 */
var gapi = {};


/** @type {!Object} */
gapi.client;


/**
 * @param {Object} args An object encapsulating arguments to this method.
 * @return {!gapi.client.HttpRequest|undefined} Return the request object if
 *     no callback is supplied in the args.
 */
gapi.client.request = function(args) {};


/**
 * @param {string} key The api key to append to requests.
 */
gapi.client.setApiKey = function(key) {};


/**
 * @constructor
 */
gapi.client.HttpRequest = function() {};


/**
 * Executes the request and calls the given callback when done.
 * @param {!function((!Object|boolean), string)} callback The function to
 *     execute when the request returns.
 */
gapi.client.HttpRequest.prototype.execute = function(callback) {};
