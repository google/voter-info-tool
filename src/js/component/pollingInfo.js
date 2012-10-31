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
goog.require('goog.fx.dom.Scroll');
goog.require('goog.fx.easing');
goog.require('goog.ui.TabBar');
goog.require('vit.api.StaticMap');
goog.require('vit.component.Accordion');
goog.require('vit.component.Component');
goog.require('vit.component.LocationMap');
goog.require('vit.templates.pollingInfo');
goog.require('vit.util');



/**
 * Component that handles rendering of polling location information.
 *
 * @param {vit.context.Context} context The application context.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {vit.component.Component}
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

  /**
   * Location map component.
   * @type {vit.component.LocationMap}
   * @private
   */
  this.locationMap_;

  /**
   * Formatted data.
   * @type {Object.<string, *>}
   */
  this.formattedData_;

  /**
   * Map of LocationTypes to Polling Location lists
   * @type {Object.<string, goog.ui.TabBar>}
   * @private
   */
  this.locationLists_ = {};
};
goog.inherits(vit.component.PollingInfo, vit.component.Component);


/**
 * Enumeration of location types.
 * @enum {string}
 */
vit.component.PollingInfo.LocationType = {
  EARLY_VOTE: 'early_vote',
  POLLING_LOCATION: 'polling_location'
};


/** @override */
vit.component.PollingInfo.prototype.createDom = function() {
  var data = this.formatData_();
  this.formattedData_ = data;
  var element = goog.soy.renderAsElement(vit.templates.pollingInfo, data);
  this.decorateVoterInfo(element);
  this.setElementInternal(element);
};


/**
 * Decorate Voter Info elements.
 * @param {Element} el The element that contains the voter info.
 */
vit.component.PollingInfo.prototype.decorateVoterInfo = function(el) {
  var accordionEl = goog.dom.getElementByClass(
      goog.getCssName('voter-info-accordion'), el);
  var accordion = new vit.component.Accordion();
  this.addChild(accordion);
  accordion.decorate(accordionEl);
  this.getHandler().listen(accordion, goog.ui.Component.EventType.SELECT,
      this.onAccordionSelect);


  var earlyVoteZippyEl = goog.dom.getElementByClass(
      goog.getCssName('early-vote-zippy'), el);
  var earlyVoteEl = earlyVoteZippyEl && goog.dom.getElementByClass(
      goog.getCssName('location-list'), earlyVoteZippyEl);
  if (earlyVoteEl) {
    var earlyVoteList = new goog.ui.TabBar();
    this.locationLists_[vit.component.PollingInfo.LocationType.EARLY_VOTE] =
        earlyVoteList;
    this.addChild(earlyVoteList);
    earlyVoteList.decorate(earlyVoteEl);
    this.getHandler().listen(earlyVoteList, goog.ui.Component.EventType.SELECT,
        goog.bind(function(list, ev) {
          this.scrollIntoView(ev.target.getElement());
          this.locationMap_.selectLocation(list.getSelectedTabIndex());
        }, this, earlyVoteList));
  }

  var otherLocationsZippyEl = goog.dom.getElementByClass(
      goog.getCssName('other-locations-zippy'), el);
  var otherLocationsEl = otherLocationsZippyEl && goog.dom.getElementByClass(
      goog.getCssName('location-list'), otherLocationsZippyEl);
  if (otherLocationsEl) {
    var otherLocationsList = new goog.ui.TabBar();
    this.locationLists_[
        vit.component.PollingInfo.LocationType.POLLING_LOCATION] =
        otherLocationsList;
    this.addChild(otherLocationsList);
    otherLocationsList.decorate(otherLocationsEl);
    this.getHandler().listen(otherLocationsList,
        goog.ui.Component.EventType.SELECT,
        goog.bind(function(list, ev) {
          this.scrollIntoView(ev.target.getElement());
          this.locationMap_.selectLocation(list.getSelectedTabIndex());
        }, this, otherLocationsList));
  }
};


/**
 * Scrolls an element into view.
 * @param {Element} child Child element to scroll into view.
 */
vit.component.PollingInfo.prototype.scrollIntoView = function(child) {
  var parent = goog.dom.getParentElement(child);
  var coords = goog.style.getContainerOffsetToScrollInto(child, parent, true);
  new goog.fx.dom.Scroll(parent, [parent.scrollLeft, parent.scrollTop],
    [parent.scrollLeft, coords.y], 300, goog.fx.easing.easeOut).play();
};

/**
 * Handles a selection from the polling info accordion.
 * @param {goog.events.Event} ev The SELECT event.
 */
vit.component.PollingInfo.prototype.onAccordionSelect = function(ev) {
  var sectionEl = ev.target.getSelected();
  if (!sectionEl) {
    this.removeLocationMap_();
    return;
  }
  if (goog.dom.classes.has(sectionEl, goog.getCssName('early-vote-zippy')) &&
      this.formattedData_.earlyVoteSites &&
      this.formattedData_.normalizedInput) {
    this.getLocationMap_().setLocations(
      vit.component.PollingInfo.LocationType.EARLY_VOTE,
      this.formattedData_.earlyVoteSites);
  } else if (goog.dom.classes.has(sectionEl,
      goog.getCssName('other-locations-zippy')) &&
      this.formattedData_.allPollingLocations &&
      this.formattedData_.normalizedInput) {
    this.getLocationMap_().setLocations(
      vit.component.PollingInfo.LocationType.POLLING_LOCATION,
      this.formattedData_.allPollingLocations);
  } else {
    this.removeLocationMap_();
  }
};


/**
 * Gets an existing locationMap or renders one if none exists.
 * @return {vit.component.LocationMap} The location map.
 * @private
 */
vit.component.PollingInfo.prototype.getLocationMap_ = function() {
  if (!this.locationMap_) {
    this.locationMap_ = new vit.component.LocationMap(
        this.formattedData_.normalizedInput);
    var contestPaneEl = goog.dom.getElementByClass(
      goog.getCssName('contest-pane'));
    this.locationMap_.render(contestPaneEl);
    this.getHandler().listen(this.locationMap_,
        vit.component.LocationMap.Events.SELECT, goog.bind(
          this.handleMapSelectEvent, this));
    this.getHandler().listen(this.locationMap_,
        vit.component.LocationMap.Events.GEOCODE, goog.bind(
          this.handleMapGeocodeEvent, this));
  }
  return this.locationMap_;
};


/**
 * Handle select event from map.
 * @param {vit.component.LocationMap.LocationEvent} ev The event.
 */
vit.component.PollingInfo.prototype.handleMapSelectEvent = function(ev) {
  var tabBar = this.locationLists_[ev.locationType];
  if (tabBar.getSelectedTabIndex() != ev.locationId) {
    tabBar.setSelectedTabIndex(ev.locationId);
  }
};


/**
 * Handle geocode event from map.
 * @param {vit.component.LocationMap.LocationEvent} ev The event.
 */
vit.component.PollingInfo.prototype.handleMapGeocodeEvent = function(ev) {
  var tabBar = this.locationLists_[ev.locationType];
  var el = tabBar.getChildAt(ev.locationId)
    .getElementByClass(goog.getCssName('polling-pin-icon'));
  goog.dom.classes.remove(el, goog.getCssName('hidden'));
};


/**
 * Removes an existing locationMap.
 * @private
 */
vit.component.PollingInfo.prototype.removeLocationMap_ = function() {
  if (this.locationMap_) {
    goog.events.removeAll(this.locationMap_);
    this.locationMap_.dispose();
    this.locationMap_ = null;
  }
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
  var formattedPollingLocations = civicInfo.pollingLocations &&
        civicInfo.pollingLocations.length &&
        this.formatAllThePollingLocations_(civicInfo.pollingLocations) || null;
  var formattedEarlyVoteSites = civicInfo.earlyVoteSites &&
        civicInfo.earlyVoteSites.length &&
        this.formatAllThePollingLocations_(civicInfo.earlyVoteSites) || null;
  return {
    pollingLocation: formattedPollingLocations && formattedPollingLocations[0],
    normalizedInput: this.formatAddress_(civicInfo.normalizedInput),
    staticMapUrl: staticMapUrl,
    directionsUrl: directionsUrl,
    mapUrl: mapUrl,
    allPollingLocations: formattedPollingLocations &&
        formattedPollingLocations.length > 1 &&
        formattedPollingLocations || null,
    earlyVoteSites: formattedEarlyVoteSites,
    suggestOfficial: vit.agent.CivicInfo.suggestOfficialWebsite(civicInfo)
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
  var clone = goog.object.clone(pollingLocation);
  clone.address = pollingLocation.address && this.formatAddress_(clone.address);
  clone.pollingHours = this.formatHours_(clone.pollingHours);
  return /** @type {vit.api.CivicInfo.PollingLocation} */ (clone);
};


/**
 * Formats all polling locations in a list for use in the template.
 * @param {Array.<vit.api.CivicInfo.PollingLocation>} pollingLocations Polling
 *   locations to format.
 * @return {Array.<vit.api.CivicInfo.PollingLocation>} Formatted polling
 *   locations.
 * @private
 */
vit.component.PollingInfo.prototype.formatAllThePollingLocations_ =
    function(pollingLocations) {
  /**
   * Array of polling locations.
   * @type {Array.<vit.api.CivicInfo.PollingLocation>}
   */
  var formatted = [];
  var len = pollingLocations.length;
  for (var i = 0; i < len; i++) {
    formatted.push(this.formatPollingLocation_(pollingLocations[i]));
  }
  return formatted;
};


/**
 * Formats an address for use in the template.
 * @param {vit.api.CivicInfo.Address} address Address to format.
 * @return {vit.api.CivicInfo.Address} Formatted address.
 * @private
 */
vit.component.PollingInfo.prototype.formatAddress_ = function(address) {
  if (!address) {
    return address;
  }
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


/**
 * Formats polling hours for use in the template.
 * @param {string} hours Hours string to format.
 * @return {string} Formatted hours.
 * @private
 */
vit.component.PollingInfo.prototype.formatHours_ = function(hours) {
  if (!hours) {
    return hours;
  }
  return hours.replace(/_/g, '-'); // Yay, DC!
};


/** @override */
vit.component.PollingInfo.prototype.disposeInternal = function() {
  this.removeLocationMap_();
  this.context_ = null;

  goog.base(this, 'disposeInternal');
};


/**
 * Static map api URL.
 * @type {string}
 * @const
 */
vit.component.PollingInfo.MAPS_URL = 'https://maps.google.com/maps';
