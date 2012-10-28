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
google.maps = {};


/** @typedef {{text: string, value: number}} */
google.maps.Distance;


/**
 * Enumeration of DistanceMatrixElement Status codes.
 * @enum {string}
 */
google.maps.DistanceMatrixElementStatus = {};
google.maps.DistanceMatrixElementStatus.NOT_FOUND;
google.maps.DistanceMatrixElementStatus.OK;
google.maps.DistanceMatrixElementStatus.ZERO_RESULTS;


/**
 * Type definition for DistanceMatrixResponseElement.
 * @typedef {{
 *   distance: google.maps.Distance,
 *   duration: google.maps.Duration,
 *   status: google.maps.DistanceMatrixElementStatus
 * }}
 */
google.maps.DistanceMatrixResponseElement;


/**
 * Constructs DistanceMatrixService instance.
 * @constructor
 */
google.maps.DistanceMatrixService = function() {};


/**
 * Retrieves autocomplete predictions based on the request object.
 * @param {!Object} request The request object.
 * @param {!function(!Object, google.maps.DistanceMatrixStatus)}
 *     callback The function to call when the request completes.
 */
google.maps.DistanceMatrixService.prototype.getDistanceMatrix =
    function(request, callback) {};


/**
 * Enumeration of DistanceMatrix Status codes.
 * @enum {string}
 */
google.maps.DistanceMatrixStatus = {};
google.maps.DistanceMatrixStatus.INVALID_REQUEST;
google.maps.DistanceMatrixStatus.MAX_DIMENSIONS_EXCEEDED;
google.maps.DistanceMatrixStatus.MAX_ELEMENTS_EXCEEDED;
google.maps.DistanceMatrixStatus.OK;
google.maps.DistanceMatrixStatus.OVER_QUERY_LIMIT;
google.maps.DistanceMatrixStatus.REQUEST_DENIED;
google.maps.DistanceMatrixStatus.UNKNOWN_ERROR;


/** @typedef {{text: string, value: number}} */
google.maps.Duration;


/**
 * Define the event namespace.
 */
google.maps.event;


/**
 * Adds the given listener function to the given event name for the given
 * object instance. Returns an identifier for this listener that can be used
 * with removeListener().
 * @param {Object} instance
 * @param {string} eventName
 * @param {Function} handler
 * @return {google.maps.MapsEventListener}
 */
google.maps.event.addListener = function(instance, eventName, handler) {};


/**
 * Removes all listeners for all events for the given instance.
 * @param {Object} instance
 */
google.maps.event.clearInstanceListeners = function(instance) {};


/**
 * Type definition for opaque MapsEventListener.
 * @typedef {Object}
 */
google.maps.MapsEventListener;


/**
 * Constructs a Geocoder instance.
 * @constructor
 */
google.maps.Geocoder = function() {};


/**
 * Geocode a request.
 * @param {google.maps.GeocoderRequest} request
 * @param {function(Array.<google.maps.GeocoderResult>,
 *   google.maps.GeocoderStatus)}
 *   callback
 */
google.maps.Geocoder.prototype.geocode = function(request, callback) {};


/**
 * Type definition for a GeocoderRequest.
 * @typedef {{
 *   address: string
 * }}
 */
google.maps.GeocoderRequest;


/**
 * Enumeration for GeocoderStatus.
 * @enum {string}
 */
google.maps.GeocoderStatus = {};
google.maps.GeocoderStatus.ERROR;
google.maps.GeocoderStatus.INVALID_REQUEST;
google.maps.GeocoderStatus.OK;
google.maps.GeocoderStatus.OVER_QUERY_LIMIT;
google.maps.GeocoderStatus.REQUEST_DENIED;
google.maps.GeocoderStatus.UNKNOWN_ERROR;
google.maps.GeocoderStatus.ZERO_RESULTS;


/**
 * Type definition for a GeocoderResult.
 * @typedef {{
 *   address_components: Array.<google.maps.GeocoderAddressComponent>,
 *   formatted_address: string,
 *   geometry: google.maps.GeocoderGeometry,
 *   types: Array.<string>
 * }}
 */
google.maps.GeocoderResult;


/**
 * Type definition for GeocoderAddressComponent.
 * @typedef {{
 *   long_name: string,
 *   short_name: string,
 *   types: Array.<string>
 * }}
 */
google.maps.GeocoderAddressComponent;


/**
 * Type definition for GeocoderGeometry.
 * @typedef {{
 *   bounds: google.maps.LatLngBounds,
 *   location: google.maps.LatLng,
 *   location_type: google.maps.GeocoderLocationType,
 *   viewport: google.maps.LatLngBounds
 * }}
 */
google.maps.GeocoderGeometry;


/**
 * Enumeration of the types of locations returned from a geocode.
 * @enum {string}
 */
google.maps.GeocoderLocationType = {};
google.maps.GeocoderLocationType.APPROXIMATE;
google.maps.GeocoderLocationType.GEOMETRIC_CENTER;
google.maps.GeocoderLocationType.RANGE_INTERPOLATED;
google.maps.GeocoderLocationType.ROOFTOP;


/**
 * Constructs LatLng instance.
 * @constructor
 */
google.maps.InfoWindow = function() {};


/**
 * @param {google.maps.Map=} map
 * @param {google.maps.Marker=} anchor
 */
google.maps.InfoWindow.prototype.open = function(map, anchor) {};


/**
 * @param {string|Node} content
 */
google.maps.InfoWindow.prototype.setContent = function(content) {};


/**
 * Closes the info window.
 */
google.maps.InfoWindow.prototype.close = function() {};


/**
 * Constructs LatLng instance.
 * @param {number} lat Latitude.
 * @param {number} lng Longitude.
 * @param {boolean=} noWrap Whether or not to disable wrapping.
 * @constructor
 */
google.maps.LatLng = function(lat, lng, noWrap) {};


/**
 * Compares two LatLng objects.
 * @param {google.maps.LatLng} other LatLng to compare to.
 * @return {boolean} Whether or not the LatLngs are equal.
 */
google.maps.LatLng.prototype.equals = function(other) {};


/**
 * Returns the latitude in degrees.
 * @return {number} The latitude.
 */
google.maps.LatLng.prototype.lat = function() {};


/**
 * Returns the longitude in degrees.
 * @return {number} The longitude.
 */
google.maps.LatLng.prototype.lng = function() {};


/**
 * Converts to string representation.
 * @return {string} The string representation.
 */
google.maps.LatLng.prototype.toString = function() {};


/**
 * Returns a string of the form "lat,lng" for this LatLng.
 * @param {number=} precision Number of decimal places to round to.
 * @return {string} The string representation.
 */
google.maps.LatLng.prototype.toUrlValue = function(precision) {};


/**
 * Constructs a LatLngBounds instance.
 * @param {google.maps.LatLng=} sw The SW corner of the bounds.
 * @param {google.maps.LatLng=} ne The NE corner of the bounds.
 * @constructor
 */
google.maps.LatLngBounds = function(sw, ne) {};


/**
 * Extends this bounds to contain the given point.
 * @param {google.maps.LatLng} point Point to include in the bounds.
 */
google.maps.LatLngBounds.prototype.extend = function(point) {};


/**
 * Constructs a Map instance.
 * @param {Node} mapDiv The container element.
 * @param {google.maps.MapOptions=} opts Initialization options.
 * @constructor
 */
google.maps.Map = function(mapDiv, opts) {};


/**
 * Type definition for MapOptions
 * @typedef {{
 *   center: google.maps.LatLng,
 *   mapTypeId: google.maps.MapTypeId,
 *   maxZoom: number,
 *   zoom: number
 * }}
 */
google.maps.MapOptions;

/**
 * Sets the viewport to contain the given bounds.
 * @param {google.maps.LatLngBounds} bounds The bounds to which to fit the
 *   the viewport.
 */
google.maps.Map.prototype.fitBounds = function(bounds) {};


/**
 * Constructs a Marker instance.
 * @param {google.maps.MarkerOptions=} opts Initialization options.
 * @constructor
 */
google.maps.Marker = function(opts) {};


/**
 * Renders the marker on the specified map or panorama.
 * If map is set to null, the marker will be removed.
 * @param {google.maps.Map} map The map on which to render the marker.
 */
google.maps.Marker.prototype.setMap = function(map) {};


/**
 * Sets the marker options.
 * @param {google.maps.MarkerOptions} opts The options to set.
 */
google.maps.Marker.prototype.setOptions = function(opts) {};

/**
 * Sets the marker icon.
 * @param {google.maps.MarkerImage} icon
 */
google.maps.Marker.prototype.setIcon = function(icon) {};


/**
 * Type definition for MarkerOptions
 * @typedef {{
 *   clickable: boolean,
 *   draggable: boolean,
 *   icon: (google.maps.MarkerImage|string),
 *   map: google.maps.Map,
 *   position: google.maps.LatLng,
 *   raiseOnDrag: boolean,
 *   shadow: (google.maps.MarkerImage|string),
 *   title: string,
 *   visible: boolean
 * }}
 */
google.maps.MarkerOptions;


/**
 * Constructs a MarkerImage instance.
 * @param {string} url Icon URL
 * @param {google.maps.Size=} size Icon size.
 * @param {google.maps.Point=} origin Origin within sprite.
 * @param {google.maps.Point=} anchor Point at which to anchor to map location.
 * @param {google.maps.Point=} scaledSize Size of entire sprite after scaling.
 * @constructor
 */
google.maps.MarkerImage = function(url, size, origin, anchor, scaledSize) {};

/**
 * @type {string}
 */
google.maps.MarkerImage.prototype.url;


/**
 * @type {google.maps.Point}
 */
google.maps.MarkerImage.prototype.origin;


/**
 * @type {google.maps.Point}
 */
google.maps.MarkerImage.prototype.anchor;


/**
 * @type {google.maps.Point}
 */
google.maps.MarkerImage.prototype.scaledSize;


/**
 * @type {google.maps.Size}
 */
google.maps.MarkerImage.prototype.size;


/**
 * Enumeration of MapTypeIds.
 * @enum {string}
 */
google.maps.MapTypeId = {};
google.maps.MapTypeId.HYBRID;
google.maps.MapTypeId.ROADMAP;
google.maps.MapTypeId.SATELLITE;
google.maps.MapTypeId.TERRAIN;


/**
 * Constructs a Size object.
 * @param {number} width The width along the x-axis, in pixels.
 * @param {number} height The height along the y-axis, in pixels.
 * @constructor
 */
google.maps.Size = function(width, height) {};


/**
 * @type {number}
 */
google.maps.Size.prototype.width;


/**
 * @type {number}
 */
google.maps.Size.prototype.height;


/**
 * Constructs a Point object.
 * @param {number} x The X coordinate.
 * @param {number} y The Y coordinate.
 * @constructor
 */
google.maps.Point = function(x, y) {};


/**
 * @type {number}
 */
google.maps.Point.prototype.x;


/**
 * @type {number}
 */
google.maps.Point.prototype.y;


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
 * Enumeration of TravelModes.
 * @enum {string}
 */
google.maps.TravelMode = {};
google.maps.TravelMode.BICYCLING;
google.maps.TravelMode.DRIVING;
google.maps.TravelMode.TRANSIT;
google.maps.TravelMode.WALKING;


/**
 * Enumeration of UnitSystems.
 * @enum {string}
 */
google.maps.UnitSystem = {};
google.maps.UnitSystem.IMPERIAL;
google.maps.UnitSystem.METRIC;


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
