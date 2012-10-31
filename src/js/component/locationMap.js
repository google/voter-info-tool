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
 * @fileoverview Component that handles rendering of polling locations on a map.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.LocationMap');

goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('vit.component.Component');
goog.require('vit.context');
goog.require('vit.templates.largeMap');



/**
 * Component that handles rendering of the region selector.
 *
 * @param {vit.api.CivicInfo.Address=} opt_origin Origin address.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {vit.component.Component}
 * @constructor
 */
vit.component.LocationMap = function(opt_origin, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The list of polling locations to place on the map.
   * @type {Array.<vit.api.CivicInfo.PollingLocation>}
   * @private
   */
  this.locationList_;

  /**
   * The type of polling locations on the map.
   * @type {string}
   * @private
   */
  this.locationType_;

  /**
   * The origin address.
   * @type {?vit.api.CivicInfo.Address}
   * @private
   */
  this.origin_ = opt_origin || null;

  /**
   * The map.
   * @type {google.maps.Map}
   * @private
   */
  this.map_;

  /**
   * The bounds that contain active markers.
   * @type {google.maps.LatLngBounds}
   * @private
   */
  this.bounds_;

  /**
   * A Geocoder instance.
   * @type {google.maps.Geocoder}
   * @private
   */
  this.geocoder_;

  /**
   * List of map markers.
   * @type {Array.<google.maps.Marker>}
   * @private
   */
  this.markers_ = [];

  /**
   * Origin Marker.
   * @type {google.maps.Marker}
   * @private
   */
  this.originMarker_;

  /**
   * Timeout between adding markers and fitting the map to the bounds.
   * @private
   * @type {?number}
   */
  this.fitTimeout_;
};
goog.inherits(vit.component.LocationMap, vit.component.Component);


/**
 * Enumeration of event types.
 * @enum {string}
 */
vit.component.LocationMap.Events = {
  SELECT: 'select',
  GEOCODE: 'geocode'
};


/**
 * The timeout in ms between adding a marker and fitting the map.
 * @type {number}
 */
vit.component.LocationMap.FIT_TIMEOUT = 100;


/**
 * Maximum number of points to geocode at a time.
 */
vit.component.LocationMap.MAX_GEOCODE = 5;


/** @override */
vit.component.LocationMap.prototype.createDom = function() {
  var element = goog.soy.renderAsElement(vit.templates.largeMap);
  this.setElementInternal(element);
};


/**
 * Selects a polling location marker.
 * @param {number} index The index of the polling location to select.
 */
vit.component.LocationMap.prototype.selectLocation = function(index) {
  var bounds = this.bounds_;
  this.geocodeLocation(this.locationList_[index], goog.bind(
    function(index, location) {
      this.dispatchEvent(new vit.component.LocationMap.LocationEvent(
        vit.component.LocationMap.Events.GEOCODE, this, this.locationType_,
        index));
      this.addLocation_(index, location, bounds, true);
      this.onMarkerClick_(this.markers_[index], index);
    }, this, index));
};


/**
 * Sets the origin and list of locations.
 *
 * @param {string} locationType Type of locations.
 * @param {Array.<vit.api.CivicInfo.PollingLocation>} locationList List of
 *   polling locations to place on map.
 */
vit.component.LocationMap.prototype.setLocations =
    function(locationType, locationList) {
  this.removeMarkers();
  this.locationType_ = locationType;
  this.locationList_ = locationList;
  var bounds = new google.maps.LatLngBounds();
  this.bounds_ = bounds;
  if (this.origin_) {
    var origin = /** @type {vit.api.CivicInfo.Address} */ (this.origin_);
    this.geocodeAddress(origin, goog.bind(this.addOrigin_, this, bounds));
  }
  var end = Math.min(vit.component.LocationMap.MAX_GEOCODE,
      locationList.length);
  for (var i = 0; i < end; i++) {
    this.geocodeLocation(locationList[i], goog.bind(
        function(index, location) {
          this.dispatchEvent(new vit.component.LocationMap.LocationEvent(
            vit.component.LocationMap.Events.GEOCODE, this, this.locationType_,
            index));
          this.addLocation_(index, location, bounds);
        }, this, i));
  }
  for (var i = end; i < locationList.length; i++) {
    this.addLocation_(i, locationList[i], bounds);
  }
};


/**
 * Geocodes a location.
 * @param {vit.api.CivicInfo.PollingLocation} location Location to geocode.
 * @param {function(vit.api.CivicInfo.PollingLocation)} callback Function to
 *   call when geocoding completes.
 */
vit.component.LocationMap.prototype.geocodeLocation = function(location,
  callback) {
  if (!location) {
    callback(location);
    return;
  }
  this.geocodeAddress(location.address, goog.bind(function(address) {
    location.address = address;
    callback(location);
  }, this));
};


/**
 * Geocodes an address.
 * @param {vit.api.CivicInfo.Address} address Location to geocode.
 * @param {function(vit.api.CivicInfo.Address)} callback Function to
 *   call when geocoding completes successfully. It won't be called otherwise.
 */
vit.component.LocationMap.prototype.geocodeAddress = function(address,
  callback) {
  if (!address) {
    callback(address);
    return;
  }

  if (address && address.location) {
    callback(address);
    return;
  }
  var request = {
    address: vit.api.CivicInfo.addressToString(address, true)
  };
  this.getGeocoder_().geocode(request, goog.bind(function(resp, status) {
    if (status != google.maps.GeocoderStatus.OK) {
      return;
    }
    var bestResp = null;
    for (var i = 0; i < resp.length; i++)
    {
      if (this.geocodeIsSane(resp[i])) {
        bestResp = resp[i];
        break;
      }
    }
    if (!bestResp) {
      // No sane geocodes.
      return;
    }
    address.location = bestResp.geometry.location;
    callback(address);
  }, this));
};


/**
 * Checks that a geocode result is sane.
 * @param {google.maps.GeocoderResult} geocode The result to check.
 * @return {boolean} Whether or not the geocode is sane.
 */
vit.component.LocationMap.prototype.geocodeIsSane = function(geocode) {
  if (!(geocode && geocode.geometry && geocode.address_components)) {
    return false;
  }
  var type = geocode.geometry.location_type;
  if (type != google.maps.GeocoderLocationType.ROOFTOP &&
      type != google.maps.GeocoderLocationType.RANGE_INTERPOLATED) {
    return false;
  }

  // Find the state component.
  var geocodeState;
  for (var i = 0; i < geocode.address_components.length; i++) {
    for (var j = 0; j < geocode.address_components[i].types.length; j++) {
      // TODO(jmwaura): Define address component types in constants somewhere.
      if (geocode.address_components[i].types[j] ==
            "administrative_area_level_1") {
        geocodeState = geocode.address_components[i].short_name;
        break;
      }
    }
    if (geocodeState) {
      break;
    }
  }

  if (!geocodeState) {
    return false;
  }

  if (this.origin_ && this.origin_.state) {
    if (this.origin_.state.toLowerCase() != geocodeState.toLowerCase()) {
      return false;
    }
  }

  return true;
}


/**
 * Add an origin marker to the map. Will recycle markers if possible.
 *
 * @param {google.maps.LatLngBounds} bounds Polling location bounds.
 * @private
 */
vit.component.LocationMap.prototype.addOrigin_ = function(bounds) {
  if (!(this.origin_ && this.origin_.location)) {
    return;
  }
  var latLng = this.origin_.location;

  var marker = this.originMarker_;
  if (!marker) {
    marker = new google.maps.Marker();
    this.originMarker_ = marker;
  }

  /**
   * @type {google.maps.MarkerOptions}
   */
  marker.setOptions({
    map: this.map_,
    position: latLng,
    title: this.origin_.line1 || ''
  });
  google.maps.event.addListener(marker, 'click', goog.bind(
      this.onOriginMarkerClick_, this, marker));

  bounds.extend(latLng);
  clearTimeout(this.fitTimeout_);
  this.fitTimeout_ = setTimeout(goog.bind(function(bounds) {
      this.map_.fitBounds(bounds);
    }, this, bounds), vit.component.LocationMap.FIT_TIMEOUT);
};


/**
 * Handle origin marker click events.
 * @param {google.maps.Marker} marker The marker that was clicked.
 * @private
 */
vit.component.LocationMap.prototype.onOriginMarkerClick_ = function(marker) {
  var infoWindow = this.getInfoWindow_();
  infoWindow.close();
  infoWindow.setContent(this.renderOriginInfo_());
  infoWindow.open(this.map_, marker);
};


/**
 * Add a polling location marker to the map. Will recycle markers if possible.
 *
 * @param {number} index Polling location index.
 * @param {vit.api.CivicInfo.PollingLocation} location Polling location object.
 * @param {google.maps.LatLngBounds} bounds Polling location bounds.
 * @param {boolean=} opt_noFit Do not fit map to new bounds.
 * @private
 */
vit.component.LocationMap.prototype.addLocation_ =
    function(index, location, bounds, opt_noFit) {
  if (!(location && location.address && location.address.location)) {
    return;
  }

  var latLng = location.address.location;

  var marker = this.markers_[index];
  if (!marker) {
    marker = new google.maps.Marker();
    this.markers_[index] = marker;
  }

  /**
   * @type {google.maps.MarkerOptions}
   */
  marker.setOptions({
    map: this.map_,
    position: latLng,
    title: location.address && location.address.locationName || location.name
  });
  google.maps.event.addListener(marker, 'click', goog.bind(this.onMarkerClick_,
      this, marker, index));

  bounds.extend(latLng);
  clearTimeout(this.fitTimeout_);
  if (!opt_noFit) {
    this.fitTimeout_ = setTimeout(goog.bind(function(bounds) {
        this.map_.fitBounds(bounds);
      }, this, bounds), vit.component.LocationMap.FIT_TIMEOUT);
  }
};


/**
 * Handle marker click events.
 * @param {google.maps.Marker} marker The marker that was clicked.
 * @param {number} index The marker index.
 * @private
 */
vit.component.LocationMap.prototype.onMarkerClick_ = function(marker, index) {
  var infoWindow = this.getInfoWindow_();
  infoWindow.close();
  this.dispatchEvent(new vit.component.LocationMap.LocationEvent(
    vit.component.LocationMap.Events.SELECT, this, this.locationType_, index));
  infoWindow.setContent(this.renderInfo_(this.locationList_[index]));
  infoWindow.open(this.map_, marker);
};


/**
 * Render info window for polling location.
 * @param {vit.api.CivicInfo.PollingLocation} location The location to render.
 * @return {Element} The info window content.
 * @private
 */
vit.component.LocationMap.prototype.renderInfo_ = function(location) {
  return goog.soy.renderAsElement(
    vit.templates.pollingLocationInfoWindow, {pollingLocation: location,
      originAddress: this.origin_});
};


/**
 * Render info window for origin.
 * @return {Element} The info window content.
 * @private
 */
vit.component.LocationMap.prototype.renderOriginInfo_ = function() {
  return goog.soy.renderAsElement(
    vit.templates.normalizedAddress, {normalizedInput: this.origin_});
};


/**
 * Remove all markers from the map.
 */
vit.component.LocationMap.prototype.removeMarkers = function() {
  if (this.infoWindow_) {
    this.infoWindow_.close();
  }
  for (var i = 0; i < this.markers_.length; i++) {
    if (!this.markers_[i]) {
      continue;
    }
    google.maps.event.clearInstanceListeners(this.markers_[i]);
    this.markers_[i].setMap(null);
  }
};


/**
 * Get an InfoWindow object.
 * @return {google.maps.InfoWindow} The info window.
 * @private
 */
vit.component.LocationMap.prototype.getInfoWindow_ = function() {
  if (!this.infoWindow_) {
    this.infoWindow_ = new google.maps.InfoWindow();
  }
  return this.infoWindow_;
};


/**
 * Get an Geocoder object.
 * @return {google.maps.Geocoder} The geocoder instance.
 * @private
 */
vit.component.LocationMap.prototype.getGeocoder_ = function() {
  if (! this.geocoder_) {
      this.geocoder_ = new google.maps.Geocoder();
  }
  return this.geocoder_;
};


/** @override */
vit.component.LocationMap.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  if (!this.origin_) {
    // If no origin specified, center on the US.
    this.loadMap(new google.maps.LatLng(39.061849, -96.811523), 3);
  } else {
    var origin = /** @type {vit.api.CivicInfo.Address} */ (this.origin_);
    this.geocodeAddress(origin, goog.bind(function(address) {
      // If the address is successfully geocoded, use it,
      // otherwise center on the US.
      this.loadMap(address && address.location ||
          new google.maps.LatLng(39.061849, -96.811523), 3);
    }, this));
  }
};

/**
 * Initialize the map.
 * @param {google.maps.LatLng} center Map center.
 * @param {number} zoom Zoom level.
 */
vit.component.LocationMap.prototype.loadMap = function(center, zoom) {
  /** @type {google.maps.MapOptions} */
  var opts = {
    center: center,
    maxZoom: 17,
    zoom: zoom,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  this.map_ = new google.maps.Map(this.getElement(), opts);
};


/** @override */
vit.component.LocationMap.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');
};


/** @override */
vit.component.LocationMap.prototype.disposeInternal = function() {
  this.locationList_ = null;
  this.origin_ = null;
  goog.base(this, 'disposeInternal');
};


/**
 * Object representing a location related event.
 *
 * @param {string} type Event type.
 * @param {goog.events.EventTarget} target object initiating event.
 * @param {string} locationType Type of location.
 * @param {number} locationId Id of location.
 * @extends {goog.events.Event}
 * @constructor
 */
vit.component.LocationMap.LocationEvent = function(type, target,
  locationType, locationId) {
  goog.base(this, type, target);

  /**
   * Type of location.
   * @type {string}
   */
  this.locationType = locationType;

  /**
   * Id of location.
   * @type {number}
   */
  this.locationId = locationId;
};
goog.inherits(vit.component.LocationMap.LocationEvent, goog.events.Event);
