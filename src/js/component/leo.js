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
 * @fileoverview Component that renders local election official info.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.Leo');

goog.require('goog.dom');
goog.require('goog.ui.Component');
goog.require('vit.context');
goog.require('vit.templates.leo');



/**
 * Component that handles rendering of the region selector.
 *
 * @param {vit.context.Context} context The application context.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {goog.ui.Component}
 * @constructor
 */
vit.component.Leo = function(context, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The application context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;

  /**
   * The notice subscription id.
   * @type {!number}
   * @private
   */
  this.subscriptionId_;
};
goog.inherits(vit.component.Leo, goog.ui.Component);


/** @override */
vit.component.Leo.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.subscriptionId_ = this.context_.subscribe(vit.context.CIVIC_INFO,
      this.handleCivicInfo_, this);
};


/**
 * Handles newly published civic info response by displaying a LEO box.
 * @param {vit.api.CivicInfo.Response} civicInfo The published info.
 * @private
 */
vit.component.Leo.prototype.handleCivicInfo_ = function(civicInfo) {
  goog.dom.removeChildren(this.getElement());
  if (!(civicInfo && civicInfo.state && civicInfo.state[0])) {
    return;
  }

  /*
   * Prefer the local election official, as long as there is a name and either
   * a website or an official with a phone number.
   */
  var region = civicInfo.state[0];
  var local = region.local_jurisdiction;

  /**
   * @type {?vit.component.Leo.LeoInfo}
   */
  var leo = this.getLeo_(local.electionAdministrationBody);
  if (!leo) {
    leo = this.getLeo_(region.electionAdministrationBody);
  }
  if (!leo) {
    return;
  }
  goog.soy.renderElement(this.getElement(), vit.templates.leo, leo);
};


/**
 * Type definition for LEO info as passed to the template.
 * @typedef {{
 *   administrationName: string,
 *   url: ?string,
 *   address: ?string,
 *   localOfficial: ?string,
 *   emailAddress: ?string,
 *   phoneNumber: ?string
 * }}
 */
vit.component.Leo.LeoInfo;


/**
 * Returns the the most appropriate data to display for local official contact
 * information. Prefers the local election official, as long as there is a
 * name and either
 * a website or an official with a phone number.
 * @param {vit.api.CivicInfo.ElectionAdministrationBody} jurisdiction The
 *   jurisdiction to check for LEO information.
 * @return {?vit.component.Leo.LeoInfo} The Local Election Official Information.
 * @private
 */
vit.component.Leo.prototype.getLeo_ = function(jurisdiction) {
  var leo = {};
  if (!(jurisdiction && jurisdiction.name)) {
    return null;
  } else {
    leo.administrationName = jurisdiction.name;
  }
  if (jurisdiction.electionInfoUrl) {
    leo.url = jurisdiction.electionInfoUrl;
  }
  if (jurisdiction.electionOfficials && jurisdiction.electionOfficials.length) {
    var officials = jurisdiction.electionOfficials;
    for (var i = 0; i < officials.length; i++) {
      if (officials[i].name && officials[i].officePhoneNumber) {
        leo.localOfficial = officials[i].name;
        leo.phoneNumber = officials[i].officePhoneNumber;
        leo.emailAddress = officials[i].emailAddress;
        break;
      }
    }
  }
  if (!(leo.url || leo.phoneNumber)) {
    return null;
  }

  /** @type {vit.api.CivicInfo.Address} */
  var address =
      jurisdiction.correspondenceAddress || jurisdiction.physicalAddress;
  if (address) {
    var addressStr = vit.api.CivicInfo.addressToString(address);
    if (addressStr) {
      leo.address = addressStr;
    }
  }
  return /** {vit.component.Leo.LeoInfo} */ (leo);
};


/** @override */
vit.component.Leo.prototype.exitDocument = function() {
  if (goog.isDefAndNotNull(this.subscriptionId_)) {
    this.context_.unsubscribeById(this.subscriptionId_);
  }
  goog.base(this, 'exitDocument');
};


/** @override */
vit.component.Leo.prototype.disposeInternal = function() {
  this.context_ = null;
  goog.base(this, 'disposeInternal');
};
