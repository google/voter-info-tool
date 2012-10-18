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

goog.provide('vit.api.CivicInfo');
goog.provide('vit.api.CivicInfo.Status');

goog.require('goog.string.path');
goog.require('vit.api.Api');



/**
 * Create a wrapper for the Civic Information API.
 * @param {vit.context.Context} context The application context.
 * @constructor
 * @extends {vit.api.Api}
 */
vit.api.CivicInfo = function(context) {
  goog.base(this);

  /**
   * The application context context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;

  /**
   * The election id to use for this instance.
   * @type {string}
   * @private
   */
  this.electionId_ = '';

  /**
   * Whether or not to request only official data.
   * @type {boolean}
   * @private
   */
  this.officialOnly_ = false;

  var config = this.context_.get(vit.context.CONFIG);
  if (goog.isDefAndNotNull(config)) {
    this.electionId_ = config[vit.context.ConfigName.ELECTION_ID];
    this.officialOnly_ = config[vit.context.ConfigName.OFFICIAL_ONLY];
  } else {
    throw Error('vit.api.CivicInfo instantiated before election_id ' +
        'is configured.');
  }

  /**
   * The api path to use for Civic Info requests.
   * @type {string}
   * @private
   */
  this.apiPath_ = goog.string.path.join(
      vit.api.CivicInfo.API_PATH,
      this.electionId_,
      'lookup');
};
goog.inherits(vit.api.CivicInfo, vit.api.Api);


/**
 * Look up polling location information.
 * @param {!string} address The address for which to fetch voter info.
 * @param {function((!vit.api.CivicInfo.Response|boolean), string)} callback
 *     The function to call when the request completes.
 */
vit.api.CivicInfo.prototype.lookup = function(address, callback) {
  var params = {'officialOnly': this.officialOnly_ ? 'true' : 'false'};
  var body = {'address': address};
  var responseTransformer = goog.bind(function(callback, response, raw) {
    callback(response ? this.transformResponse(response) : response, raw);
  }, this, callback);
  this.request(this.apiPath_, vit.api.POST, params, body, responseTransformer);
};


/**
 * Transform raw object into Election.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.Election} Transformed object.
 */
vit.api.CivicInfo.prototype.transformElection = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.Election} */ (obj);
  }

  var out = {};
  out.id = obj['id'];
  out.name = obj['name'];
  out.electionDay = obj['electionDay'];
  return /** @type {vit.api.CivicInfo.Election} */ (out);
};


/**
 * Transform raw object into District.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.District} Transformed object.
 */
vit.api.CivicInfo.prototype.transformDistrict = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.District} */ (obj);
  }

  var out = {};
  out.name = obj['name'];
  out.scope = obj['scope'];
  out.id = obj['id'];
  return /** @type {vit.api.CivicInfo.District} */ (out);
};


/**
 * Transform raw object into Address.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.Address} Transformed object.
 */
vit.api.CivicInfo.prototype.transformAddress = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.Address} */ (obj);
  }

  var out = {};
  out.locationName = obj['locationName'];
  out.line1 = obj['line1'];
  out.line2 = obj['line2'];
  out.line3 = obj['line3'];
  out.city = obj['city'];
  out.state = obj['state'];
  out.zip = obj['zip'];
  return /** @type {vit.api.CivicInfo.Address} */ (out);
};


/**
 * Transform raw object into ElectionOfficial.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.ElectionOfficial} Transformed object.
 */
vit.api.CivicInfo.prototype.transformElectionOfficial = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.ElectionOfficial} */ (obj);
  }

  var out = {};
  out.name = obj['name'];
  out.title = obj['title'];
  out.officePhoneNumber = obj['officePhoneNumber'];
  out.faxNumber = obj['faxNumber'];
  out.emailAddress = obj['emailAddress'];
  return /** @type {vit.api.CivicInfo.ElectionOfficial} */ (out);
};


/**
 * Transform raw object into Contest.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.Contest} Transformed object.
 */
vit.api.CivicInfo.prototype.transformContest = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.Contest} */ (obj);
  }

  var out = {};
  out.type = obj['type'];
  out.primaryParty = obj['primaryParty'];
  out.electorateSpecifications = obj['electorateSpecifications'];
  out.special = obj['special'];
  out.office = obj['office'];
  out.level = obj['level'];
  out.district = this.transformDistrict(obj['district']);
  out.numberElected = obj['numberElected'];
  out.numberVotingFor = obj['numberVotingFor'];
  out.ballotPlacement = obj['ballotPlacement'];

  if (goog.isDefAndNotNull(obj['candidates'])) {
    var len = obj['candidates'].length;
    /** @type {Array.<vit.api.CivicInfo.Candidate>} */
    var candidatesArray = [];
    for (var i = 0; i < len; i++) {
      candidatesArray[i] = this.transformCandidate(obj['candidates'][i]);
    }
    out.candidates = candidatesArray;
  }

  if (goog.isDefAndNotNull(obj['sources'])) {
    len = obj['sources'].length;
    /** @type {Array.<vit.api.CivicInfo.Source>} */
    var sourcesArray = [];
    for (var i = 0; i < len; i++) {
      sourcesArray[i] = this.transformSource(obj['sources'][i]);
    }
    out.sources = sourcesArray;
  }
  return /** @type {vit.api.CivicInfo.Contest} */ (out);
};


/**
 * Transform raw object into Channel.
 * @param {Array.<Object>} channels Raw object to transform.
 * @return {vit.api.CivicInfo.Channels} Transformed object.
 */
vit.api.CivicInfo.prototype.transformChannels = function(channels) {
  if (!goog.isDefAndNotNull(channels)) {
    return /** @type {vit.api.CivicInfo.Channels} */ (channels);
  }

  var out = {};
  var len = channels.length;
  for (var i = 0; i < len; i++) {
    var channelType = channels[i]['type'].toLowerCase();
    var channelId = channels[i]['id'];
    if (channelType == 'googleplus') {
      out.googleplus = channelId;
    } else if (channelType == 'youtube') {
      out.youtube = channelId;
    } else if (channelType == 'facebook') {
      out.facebook = channelId;
    } else if (channelType == 'twitter') {
      out.twitter = channelId;
    }
  }
  return /** @type {vit.api.CivicInfo.Channels} */ (out);
};


/**
 * Transform raw object into PollingLocation.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.PollingLocation} Transformed object.
 */
vit.api.CivicInfo.prototype.transformPollingLocation = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.PollingLocation} */ (obj);
  }

  var out = {};
  out.address = this.transformAddress(obj['address']);
  out.pollingHours = obj['pollingHours'];
  out.name = obj['name'];
  out.voterServices = obj['voterServices'];
  out.startDate = obj['startDate'];
  out.endDate = obj['endDate'];

  if (goog.isDefAndNotNull(obj['sources'])) {
    var len = obj['sources'].length;
    /** @type {Array.<vit.api.CivicInfo.Source>} */
    var sourcesArray = [];
    for (var i = 0; i < len; i++) {
      sourcesArray[i] = this.transformSource(obj['sources'][i]);
    }
    out.sources = sourcesArray;
  }
  return /** @type {vit.api.CivicInfo.PollingLocation} */ (out);
};


/**
 * Transform raw object into Candidate.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.Candidate} Transformed object.
 */
vit.api.CivicInfo.prototype.transformCandidate = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.Candidate} */ (obj);
  }

  var out = {};
  out.name = obj['name'];
  out.party = obj['party'];
  out.candidateUrl = obj['candidateUrl'];
  out.phone = obj['phone'];
  out.photoUrl = obj['photoUrl'];
  out.email = obj['email'];
  out.orderOnBallot = obj['orderOnBallot'];
  out.channels = this.transformChannels(obj['channels']);
  return /** @type {vit.api.CivicInfo.Candidate} */ (out);
};


/**
 * Transform raw object into AdministrationRegion.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.AdministrationRegion} Transformed object.
 */
vit.api.CivicInfo.prototype.transformAdministrationRegion = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.AdministrationRegion} */ (obj);
  }

  var out = {};
  out.name = obj['name'];
  out.electionAdministrationBody = this.transformElectionAdministrationBody(
      obj['electionAdministrationBody']);
  out.local_jurisdiction = this.transformAdministrationRegion(
      obj['local_jurisdiction']);

  if (goog.isDefAndNotNull(obj['sources'])) {
    var len = obj['sources'].length;
    /** @type {Array.<vit.api.CivicInfo.Source>} */
    var sourcesArray = [];
    for (var i = 0; i < len; i++) {
      sourcesArray[i] = this.transformSource(obj['sources'][i]);
    }
    out.sources = sourcesArray;
  }
  return /** @type {vit.api.CivicInfo.AdministrationRegion} */ (out);
};


/**
 * Transform raw object into ElectionAdministrationBody.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.ElectionAdministrationBody} Transformed object.
 */
vit.api.CivicInfo.prototype.transformElectionAdministrationBody =
    function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.ElectionAdministrationBody} */ (obj);
  }

  var out = {};
  out.name = obj['name'];
  out.electionInfoUrl = obj['electionInfoUrl'];
  out.electionRegistrationUrl = obj['electionRegistrationUrl'];
  out.electionRegistrationConfirmationUrl =
      obj['electionRegistrationConfirmationUrl'];
  out.absenteeVotingInfoUrl = obj['absenteeVotingInfoUrl'];
  out.votingLocationFinderUrl = obj['votingLocationFinderUrl'];
  out.ballotInfoUrl = obj['ballotInfoUrl'];
  out.electionRulesUrl = obj['electionRulesUrl'];
  out.voter_services = obj['voter_services'];
  out.hoursOfOperation = obj['hoursOfOperation'];
  out.correspondenceAddress = this.transformAddress(
      obj['correspondenceAddress']);
  out.physicalAddress = this.transformAddress(obj['physicalAddress']);

  if (goog.isDefAndNotNull(obj['electionOfficials'])) {
    var len = obj['electionOfficials'].length;
    /** @type {Array.<vit.api.CivicInfo.ElectionOfficial>} */
    var electionOfficialsArray = [];
    for (var i = 0; i < len; i++) {
      electionOfficialsArray[i] = this.transformElectionOfficial(
          obj['electionOfficials'][i]);
    }
    out.electionOfficials = electionOfficialsArray;
  }

  if (goog.isDefAndNotNull(obj['sources'])) {
    len = obj['sources'].length;
    /** @type {Array.<vit.api.CivicInfo.Source>} */
    var sourcesArray = [];
    for (var i = 0; i < len; i++) {
      sourcesArray[i] = this.transformSource(obj['sources'][i]);
    }
    out.sources = sourcesArray;
  }
  return /** @type {vit.api.CivicInfo.ElectionAdministrationBody} */ (out);
};


/**
 * Transform raw object into Source.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.Source} Transformed object.
 */
vit.api.CivicInfo.prototype.transformSource = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.Source} */ (obj);
  }

  var out = {};
  out.name = obj['name'];
  out.official = obj['official'];
  return /** @type {vit.api.CivicInfo.Source} */ (out);
};


/**
 * Transform raw object into Response.
 * @param {Object} obj Raw object to transform.
 * @return {vit.api.CivicInfo.Response} Transformed object.
 */
vit.api.CivicInfo.prototype.transformResponse = function(obj) {
  if (!goog.isDefAndNotNull(obj)) {
    return /** @type {vit.api.CivicInfo.Response} */ (obj);
  }

  var out = {};
  // TODO(jmwaura): No transform method for status. Treating as literal.
  out.status = obj['status'];
  out.election = this.transformElection(obj['election']);
  out.normalizedInput = this.transformAddress(obj['normalizedInput']);

  if (goog.isDefAndNotNull(obj['pollingLocations'])) {
    var len = obj['pollingLocations'].length;
    /** @type {Array.<vit.api.CivicInfo.PollingLocation>} */
    var pollingLocationsArray = [];
    for (var i = 0; i < len; i++) {
      pollingLocationsArray[i] = this.transformPollingLocation(
          obj['pollingLocations'][i]);
    }
    out.pollingLocations = pollingLocationsArray;
  }

  if (goog.isDefAndNotNull(obj['earlyVoteSites'])) {
    len = obj['earlyVoteSites'].length;
    /** @type {Array.<vit.api.CivicInfo.PollingLocation>} */
    var earlyVoteSitesArray = [];
    for (var i = 0; i < len; i++) {
      earlyVoteSitesArray[i] = this.transformPollingLocation(
        obj['earlyVoteSites'][i]);
    }
    out.earlyVoteSites = earlyVoteSitesArray;
  }

  if (goog.isDefAndNotNull(obj['contests'])) {
    len = obj['contests'].length;
    /** @type {Array.<vit.api.CivicInfo.Contest>} */
    var contestsArray = [];
    for (var i = 0; i < len; i++) {
      contestsArray[i] = this.transformContest(obj['contests'][i]);
    }
    contestsArray = contestsArray.filter(function(contest) {
      return contest.candidates && contest.candidates.length;
    });
    out.contests = contestsArray.sort(function(a, b) {
      // First sort by ballot placement.
      var comparison = (a && a.ballotPlacement || Number.MAX_VALUE) -
          (b && b.ballotPlacement || Number.MAX_VALUE);
      if (comparison != 0) {
        return comparison;
      }

      // Then by level.
      comparison = (a && a.level && vit.api.CivicInfo.SCOPE_ORDER[a.level] ||
          Number.MAX_VALUE) - (b && b.level &&
          vit.api.CivicInfo.SCOPE_ORDER[b.level] || Number.MAX_VALUE);
      if (comparison != 0) {
        return comparison;
      }

      // Then by scope.
      comparison = (a && a.district && a.district.scope &&
          vit.api.CivicInfo.SCOPE_ORDER[a.district.scope] ||
          Number.MAX_VALUE) - (b && b.district && b.district.scope &&
          vit.api.CivicInfo.SCOPE_ORDER[b.district.scope] ||
          Number.MAX_VALUE);
      if (comparison != 0) {
        return comparison;
      }
    });
  }

  if (goog.isDefAndNotNull(obj['state'])) {
    len = obj['state'].length;
    /** @type {Array.<vit.api.CivicInfo.AdministrationRegion>} */
    var stateArray = [];
    for (var i = 0; i < len; i++) {
      stateArray[i] = this.transformAdministrationRegion(obj['state'][i]);
    }
    out.state = stateArray;
  }
  return /** @type {vit.api.CivicInfo.Response} */ (out);
};


/**
 * @override
 */
vit.api.CivicInfo.prototype.disposeInternal = function() {
  this.context_ = null;

  goog.base(this, 'disposeInternal');
};


/**
 * Formats an address object as a string.
 * @param {vit.api.CivicInfo.Address} address Address to format.
 * @param {boolean=} opt_ignoreLocationName Whether to ignore the location name.
 * @param {boolean=} opt_ignoreZip Whether to ignore the zip code.
 * @return {string} The string representation of the address.
 */
vit.api.CivicInfo.addressToString = function(address, opt_ignoreLocationName,
    opt_ignoreZip) {
  var addressStr = '';
  if (!opt_ignoreLocationName) {
    addressStr += address.locationName ? address.locationName + ', ' : '';
  }
  addressStr += address.line1 ? address.line1 + ', ' : '';
  addressStr += address.line2 ? address.line2 + ', ' : '';
  addressStr += address.line3 ? address.line3 + ', ' : '';
  addressStr += address.city ? address.city + ', ' : '';
  addressStr += address.state ? address.state + ' ' : '';
  if (!opt_ignoreZip) {
    addressStr += address.zip ? address.zip : '';
  }

  // Remove trailing characters.
  addressStr = goog.string.trim(addressStr);
  if (addressStr.charAt(addressStr.length - 1) == ',') {
    addressStr = addressStr.substring(0, addressStr.length - 1);
  }
  return addressStr;
};


/**
 * The order by which to sort office levels in contests.
 * @type {Object.<string, number>}
 * @const
 */
vit.api.CivicInfo.LEVEL_ORDER = {
  'federal': 0,
  'state': 1,
  'county': 2,
  'city': 3,
  'other': 4
};


/**
 * The order by which to sort scoped contests.
 * @type {Object.<string, number>}
 * @const
 */
vit.api.CivicInfo.SCOPE_ORDER = {
  'statewide': 0,
  'congressional': 1,
  'stateUpper': 2,
  'stateLower': 3,
  'countywide': 4,
  'judicial': 5,
  'schoolBoard': 6,
  'cityWide': 7,
  'special': 8
};


/**
 * The default API path.
 * @type {string}
 * @const
 * TODO(jmwaura): make api version configurable.
 */
vit.api.CivicInfo.API_PATH = '/civicinfo/us_v1/voterinfo';


/**
 * Enum of the potential values for status.
 * @enum {string}
 */
vit.api.CivicInfo.Status = {
  SUCCESS: 'success',
  NO_STREET_SEGMENT_FOUND: 'noStreetSegmentFound',
  ADDRESS_UNPARSEABLE: 'addressUnparseable',
  NO_ADDRESS_PARAMETER: 'noAddressParameter',
  MULTIPLE_STREET_SEGMENTS_FOUND: 'multipleStreetSegmentsFound',
  ELECTION_OVER: 'electionOver',
  ELECTION_UNKNOWN: 'electionUnknown',
  INTERNAL_LOOKUP_FAILURE: 'internalLookupFailure',
  REQUEST_FAILURE: 'REQUEST_FAILURE'
};


/**
 * Type definition of Civic Info response.
 * @typedef {{
 *   requestTrigger: string,
 *   status: vit.api.CivicInfo.Status,
 *   election: vit.api.CivicInfo.Election,
 *   normalizedInput: vit.api.CivicInfo.Address,
 *   pollingLocations: Array.<vit.api.CivicInfo.PollingLocation>,
 *   earlyVoteSites: Array.<vit.api.CivicInfo.PollingLocation>,
 *   contests: Array.<vit.api.CivicInfo.Contest>,
 *   state: Array.<vit.api.CivicInfo.AdministrationRegion>
 * }}
 */
vit.api.CivicInfo.Response;


/**
 * Type definition of Election.
 * @typedef {{
 *   id: number,
 *   name: string,
 *   electionDay: string
 * }}
 */
vit.api.CivicInfo.Election;


/**
 * Type definition of Address.
 * @typedef {{
 *   locationName: string,
 *   line1: string,
 *   line2: string,
 *   line3: string,
 *   city: string,
 *   state: string,
 *   zip: string
 * }}
 */
vit.api.CivicInfo.Address;


/**
 * Type definition of PollingLocation.
 * @typedef {{
 *   address: vit.api.CivicInfo.Address,
 *   pollingHours: string,
 *   name: string,
 *   voterServices: string,
 *   startDate: string,
 *   endDate: string,
 *   sources: Array.<vit.api.CivicInfo.Source>
 * }}
 */
vit.api.CivicInfo.PollingLocation;


/**
 * Type definition of Contest.
 * @typedef {{
 *   type: string,
 *   primaryParty: string,
 *   electorateSpecifications: string,
 *   special: string,
 *   office: string,
 *   level: string,
 *   district: vit.api.CivicInfo.District,
 *   numberElected: number,
 *   numberVotingFor: number,
 *   ballotPlacement: number,
 *   candidates: Array.<vit.api.CivicInfo.Candidate>,
 *   sources: Array.<vit.api.CivicInfo.Source>
 * }}
 */
vit.api.CivicInfo.Contest;


/**
 * Type definition of District.
 * @typedef {{
 *   name: string,
 *   scope: string,
 *   id: string
 * }}
 */
vit.api.CivicInfo.District;


/**
 * Type definition of Candidate.
 * @typedef {{
 *   name: string,
 *   party: string,
 *   candidateUrl: string,
 *   phone: string,
 *   photoUrl: string,
 *   email: string,
 *   orderOnBallot: number,
 *   channels: vit.api.CivicInfo.Channels
 * }}
 */
vit.api.CivicInfo.Candidate;


/**
 * Type definition of Channel.
 * @typedef {{
 *   googleplus: string,
 *   youtube: string,
 *   facebook: string,
 *   twitter: string
 * }}
 */
vit.api.CivicInfo.Channels;


/**
 * Type definition of Source.
 * @typedef {{
 *   name: string,
 *   official: boolean
 * }}
 */
vit.api.CivicInfo.Source;


/**
 * Type definition of AdministrationRegion.
 * @typedef {{
 *   name: string,
 *   electionAdministrationBody: vit.api.CivicInfo.ElectionAdministrationBody,
 *   local_jurisdiction: vit.api.CivicInfo.AdministrationRegion,
 *   sources: Array.<vit.api.CivicInfo.Source>
 * }}
 */
vit.api.CivicInfo.AdministrationRegion;


/**
 * Type definition of ElectionAdministrationBody.
 * @typedef {{
 *   name: string,
 *   electionInfoUrl: string,
 *   electionRegistrationUrl: string,
 *   electionRegistrationConfirmationUrl: string,
 *   absenteeVotingInfoUrl: string,
 *   votingLocationFinderUrl: string,
 *   ballotInfoUrl: string,
 *   electionRulesUrl: string,
 *   voter_services: Array.<string>,
 *   hoursOfOperation: string,
 *   correspondenceAddress: vit.api.CivicInfo.Address,
 *   physicalAddress: vit.api.CivicInfo.Address,
 *   electionOfficials: Array.<vit.api.CivicInfo.ElectionOfficial>,
 *   sources: Array.<vit.api.CivicInfo.Source>
 * }}
 */
vit.api.CivicInfo.ElectionAdministrationBody;


/**
 * Type definition of ElectionOfficial.
 * @typedef {{
 *   name: string,
 *   title: string,
 *   officePhoneNumber: string,
 *   faxNumber: string,
 *   emailAddress: string
 * }}
 */
vit.api.CivicInfo.ElectionOfficial;
