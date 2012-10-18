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
 * @fileoverview Agent to interface the Civic Info API with the VIT PubSub
 * infrastructure.
 * @author jmwaura@google.com (Jesse Mwaura)
 */

goog.provide('vit.agent.CivicInfo');

goog.require('goog.Disposable');
goog.require('vit.api.CivicInfo');
goog.require('vit.api.CivicInfo.Status');
goog.require('vit.context.Context');
goog.require('vit.context.NoticeType');



/**
 * Construct Civic Info agent.
 * @param {vit.context.Context} context The application context.
 * @constructor
 * @extends {goog.Disposable}
 */
vit.agent.CivicInfo = function(context) {
  goog.base(this);

  /**
   * The application context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;

  /**
   * The Civic Info API.
   * @type {vit.api.CivicInfo}
   * @private
   */
  this.api_ = new vit.api.CivicInfo(context);
  this.registerDisposable(this.api_);

  /**
   * Subscription ID for address change notifications.
   * @type {?number}
   * @private
   */
  this.addressSubscription_;

  /**
   * Subscription ID for region change notifications.
   * @type {?number}
   * @private
   */
  this.regionSubscription_;
};
goog.inherits(vit.agent.CivicInfo, goog.Disposable);


/**
 * Initialize this agent.
 * @return {vit.agent.CivicInfo} return this agent.
 */
vit.agent.CivicInfo.prototype.init = function() {
  var addressChangeHandler =
      goog.bind(this.handleAddressChange_, this, vit.context.ADDRESS);
  var regionChangeHandler =
      goog.bind(this.handleAddressChange_, this, vit.context.REGION);
  /**
   * Subscription ID for address change notifications.
   * @type {number}
   * @private
   */
  this.addressSubscription_ =
      this.context_.subscribe(vit.context.ADDRESS, addressChangeHandler);

  /**
   * Subscription ID for region change notifications.
   * @type {number}
   * @private
   */
  this.regionSubscription_ =
      this.context_.subscribe(vit.context.REGION, regionChangeHandler);

  return this;
};


/**
 * Handle a change in the address.
 * @param {string} trigger Trigger that caused a lookup.
 * @param {?string} newAddress New address.
 * @param {?string} oldAddress Old address.
 * @private
 */
vit.agent.CivicInfo.prototype.handleAddressChange_ =
    function(trigger, newAddress, oldAddress) {
  newAddress = /** @type {string} */ (newAddress) || '';
  if (!newAddress || newAddress == oldAddress) {
    return;
  }
  this.api_.lookup(newAddress,
      goog.bind(this.handleApiResponse_, this, trigger)
  );
};


/**
 * Handle a response from the api in the address.
 * @param {string} trigger Trigger that caused a lookup.
 * @param {!vit.api.CivicInfo.Response|boolean} result Result object.
 * @param {string} rawResponse Raw JSON formatted response.
 * @private
 */
vit.agent.CivicInfo.prototype.handleApiResponse_ =
    function(trigger, result, rawResponse) {
  if (!result) {
    this.context_.set(vit.context.NOTICE,
        vit.agent.CivicInfo
            .noticeMap[vit.api.CivicInfo.Status.REQUEST_FAILURE](result));
    this.context_.set(vit.context.CIVIC_INFO, null);
    return;
  }
  var resultStatus = result.status;
  if (resultStatus != vit.api.CivicInfo.Status.SUCCESS) {
    if (!(resultStatus == vit.api.CivicInfo.Status.ADDRESS_UNPARSEABLE &&
        trigger == vit.context.REGION)) {
      if (goog.object.containsKey(vit.agent.CivicInfo.noticeMap,
          resultStatus)) {
        this.context_.set(vit.context.NOTICE,
            vit.agent.CivicInfo.noticeMap[resultStatus](result));
      } else {
        this.context_.set(vit.context.NOTICE,
            vit.agent.CivicInfo.generateMsgGenericFailure(result));
      }
      this.context_.set(vit.context.CIVIC_INFO, null);
      return;
    }
  }
  if (result.election.name.search(/(^| )test( |$)/i) >= 0) {
    this.context_.set(vit.context.NOTICE,
            vit.agent.CivicInfo.generateMsgTestElection(result));
  } else {
    // TODO(jmwaura): Remove this when we're ready to go live.
    this.context_.set(vit.context.NOTICE,
            vit.agent.CivicInfo.generateMsgTestElection(result));
    //this.context_.set(vit.context.NOTICE, null);
  }
  // Set the request trigger on the response.
  result.requestTrigger = trigger;
  this.context_.set(vit.context.CIVIC_INFO, result);
};

/**
 * @override
 */
vit.agent.CivicInfo.prototype.disposeInternal = function() {
  if (goog.isDefAndNotNull(this.addressSubscription_)) {
    this.context_.unsubscribeById(this.addressSubscription_);
  }
  if (goog.isDefAndNotNull(this.regionSubscription_)) {
    this.context_.unsubscribeById(this.regionSubscription_);
  }
  this.context_ = null;
  goog.base(this, 'disposeInternal');
};


/**
 * Generates a message that suggests where the user may be able to find
 * more information.
 * @param {boolean | vit.api.CivicInfo.Response} response The api response.
 * @return {string} The official website suggestion.
 */
vit.agent.CivicInfo.suggestOfficialWebsite = function(response) {
  if (response && response.state && response.state[0] &&
      response.state[0].electionAdministrationBody &&
      response.state[0].electionAdministrationBody.name &&
      response.state[0].electionAdministrationBody.votingLocationFinderUrl) {
    var leo = '<a href="' +
        goog.string.htmlEscape(response.state[0]
            .electionAdministrationBody.votingLocationFinderUrl) +
        '">' +
        goog.string.htmlEscape(response.state[0]
            .electionAdministrationBody.name) +
        '</a>';
    /**
     * @desc Suggestion for where the user can get their voting information.
     *     This text appears as part of an error message.
     */
    var MSG_ERR_SUGG_URL = goog.getMsg('Check the {$electionOfficial} ' +
        'website for complete voter information.', {'electionOfficial': leo});
    return MSG_ERR_SUGG_URL;
  } else {
    /**
     * @desc Suggestion for where the user can get their voting information.
     *     This text appears as part of an error message.
     */
    var MSG_ERR_SUGG = goog.getMsg('Contact your local election official ' +
        'for complete voter information.');
    return MSG_ERR_SUGG;
  }
};

/**
 * Generates an notice given a type, message text, and a response object.
 * @param {vit.context.NoticeType} type Type of message to generate.
 * @param {string} text Message text.
 * @param {boolean | vit.api.CivicInfo.Response} response The api response.
 * @return {vit.context.Notice} The notice.
 */
vit.agent.CivicInfo.generateMsg = function(type, text, response) {
  return {
    type: type,
    title: text,
    desc: vit.agent.CivicInfo.suggestOfficialWebsite(response)
  };
};


/**
 * Generates a generic error message.
 * @param {boolean | vit.api.CivicInfo.Response} response The api response.
 * @return {vit.context.Notice} The notice.
 */
vit.agent.CivicInfo.generateMsgGenericFailure = function(response) {
  /** @desc Error message from a lookup failure. */
  var MSG_ERR_GENERIC = goog.getMsg('We encountered an error and could not ' +
      'complete your request. If the problem persists, please report your ' +
      'problem and mention this error message and the query that caused it. ' +
      'That\'s all we know.');
  return vit.agent.CivicInfo.generateMsg(vit.context.NoticeType.ERROR,
    MSG_ERR_GENERIC, response);
};


/**
 * Generates a message for the case where no street segment is found.
 * @param {boolean | vit.api.CivicInfo.Response} response The api response.
 * @return {vit.context.Notice} The notice.
 */
vit.agent.CivicInfo.generateMsgNoStreetSegmentFound = function(response) {
  /** @desc Error message from a lookup failure. */
  var MSG_ERR_NO_SEG = goog.getMsg('We were unable to find the voting ' +
      'information for your address.');
  return vit.agent.CivicInfo.generateMsg(vit.context.NoticeType.INFO,
    MSG_ERR_NO_SEG, response);
};


/**
 * Generates a message for the case where the address could not be parsed.
 * @param {boolean | vit.api.CivicInfo.Response} response The api response.
 * @return {vit.context.Notice} The notice.
 */
vit.agent.CivicInfo.generateMsgAddressUnparseable = function(response) {
  /** @desc Error message from a lookup failure. */
  var MSG_ERR_UNPARSEABLE = goog.getMsg('We did not understand your ' +
    'address. Please make sure it is spelled correctly and includes a city ' +
    'and state.');
  return vit.agent.CivicInfo.generateMsg(vit.context.NoticeType.ERROR,
    MSG_ERR_UNPARSEABLE, response);
};


/**
 * Generates a message for the case where there is more than one matching street
 * segment.
 * @param {boolean | vit.api.CivicInfo.Response} response The api response.
 * @return {vit.context.Notice} The notice.
 */
vit.agent.CivicInfo.generateMsgMultipleStreetSegmentsFound =
    function(response) {
  /** @desc Error message from a lookup failure. */
  var MSG_ERR_MULT_SEG = goog.getMsg('We were unable to find accurate ' +
    'information for your address.');
  return vit.agent.CivicInfo.generateMsg(vit.context.NoticeType.ERROR,
    MSG_ERR_MULT_SEG, response);
};


/**
 * Generates a message for the case where the election has ended.
 * @param {boolean | vit.api.CivicInfo.Response} response The api response.
 * @return {vit.context.Notice} The notice.
 */
vit.agent.CivicInfo.generateMsgElectionOver = function(response) {
  var message = '';
  if (response && response.election && response.election.name &&
      response.election.electionDay) {
    /** @desc Error message from a lookup failure. */
    var MSG_ERR_OVER_INFO = goog.getMsg('The election "{$name}" took place ' +
        'on {$date}. Voter information is no longer available for this ' +
        'election.',
        {
          'name': response.election.name,
          'date': response.election.electionDay
        });
    message = MSG_ERR_OVER_INFO;
  } else {
    /** @desc Error message from a lookup failure. */
    var MSG_ERR_OVER = goog.getMsg('The election has already taken place. ' +
        'Voter information is no longer available.');
    message = MSG_ERR_OVER;
  }
  return vit.agent.CivicInfo.generateMsg(vit.context.NoticeType.INFO,
    message, response);
};


/**
 * Generates a message for the case where there is no matching election.
 * @param {boolean | vit.api.CivicInfo.Response} response The api response.
 * @return {vit.context.Notice} The notice.
 */
vit.agent.CivicInfo.generateMsgElectionUnknown = function(response) {
  /** @desc Error message from a lookup failure. */
  var MSG_ERR_UNKNOWN = goog.getMsg('This application has been configured ' +
    'incorrectly. If you maintain the application, please make sure you ' +
    'are providing a valid election id.');
  return vit.agent.CivicInfo.generateMsg(vit.context.NoticeType.WARNING,
    MSG_ERR_UNKNOWN, response);
};


/**
 * Generates a message for when the api returns a test election.
 * @param {boolean | vit.api.CivicInfo.Response} response The api response.
 * @return {vit.context.Notice} The notice.
 */
vit.agent.CivicInfo.generateMsgTestElection = function(response) {
  /** @desc Error message from a lookup failure. */
  var MSG_ERR_TEST = goog.getMsg('This data is for testing purposes only.');
  return vit.agent.CivicInfo.generateMsg(vit.context.NoticeType.WARNING,
    MSG_ERR_TEST, response);
};


/**
 * Map of expected notices to their message generator functions.
 * @type {Object.<vit.api.CivicInfo.Status,
 *     function((boolean | vit.api.CivicInfo.Response))>}
 */
vit.agent.CivicInfo.noticeMap = function() {
  var map = {};
  var status = vit.api.CivicInfo.Status;
  map[vit.api.CivicInfo.Status.NO_STREET_SEGMENT_FOUND] =
      vit.agent.CivicInfo.generateMsgNoStreetSegmentFound;
  map[vit.api.CivicInfo.Status.ADDRESS_UNPARSEABLE] =
      vit.agent.CivicInfo.generateMsgAddressUnparseable;
  map[vit.api.CivicInfo.Status.NO_ADDRESS_PARAMETER] =
      vit.agent.CivicInfo.generateMsgGenericFailure;
  map[vit.api.CivicInfo.Status.MULTIPLE_STREET_SEGMENTS_FOUND] =
      vit.agent.CivicInfo.generateMsgMultipleStreetSegmentsFound;
  map[vit.api.CivicInfo.Status.ELECTION_OVER] =
      vit.agent.CivicInfo.generateMsgElectionOver;
  map[vit.api.CivicInfo.Status.ELECTION_UNKNOWN] =
      vit.agent.CivicInfo.generateMsgElectionUnknown;
  map[vit.api.CivicInfo.Status.INTERNAL_LOOKUP_FAILURE] =
      vit.agent.CivicInfo.generateMsgGenericFailure;
  map[vit.api.CivicInfo.Status.REQUEST_FAILURE] =
      vit.agent.CivicInfo.generateMsgGenericFailure;
  return map;
}();
