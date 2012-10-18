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
 * @fileoverview Component that renders contest info and handles interaction.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.ContestInfo');

goog.require('goog.soy');
goog.require('goog.ui.AdvancedTooltip');
goog.require('goog.ui.Component');
goog.require('goog.ui.Component.EventType');
goog.require('vit.api.CivicInfo');
goog.require('vit.component.ScrollingTabBar');
goog.require('vit.context.Context');
goog.require('vit.templates.candidates');
goog.require('vit.templates.contestInfo');
goog.require('vit.util');


/**
 * Create contest info component.
 *
 * @param {vit.context.Context} context The application context.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {goog.ui.Component}
 * @constructor
 */
vit.component.ContestInfo = function(context, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The application context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;

  /**
   * The set of contests displayed by this component.
   * @type {Array.<vit.api.CivicInfo.Contest>}
   * @private
   */
  this.contests_;

  /**
   * The region for the current result set.
   * @type {?string}
   * @private
   */
  this.region_;

  /**
   * Content element
   * @type {Element}
   * @private
   */
  this.tabContentElement_;

  /**
   * Tab Bar component.
   * @type {vit.component.ScrollingTabBar}
   * @private
   */
  this.tabBar_;

  /**
   * Hover Card.
   * @type {goog.ui.AdvancedTooltip}
   * @private
   */
  this.hoverCard_;
};
goog.inherits(vit.component.ContestInfo, goog.ui.Component);


/** @override */
vit.component.ContestInfo.prototype.createDom = function() {
  var civicInfo = /** @type vit.api.CivicInfo.Response */
      (this.context_.get(vit.context.CIVIC_INFO));
  this.region_ = civicInfo && civicInfo.normalizedInput &&
      civicInfo.normalizedInput.state || null;
  this.contests_ = /** @type {Array.<vit.api.CivicInfo.Contest>} */
      civicInfo && civicInfo.contests || null;
  var data = this.formatData_(civicInfo);
  var element = goog.soy.renderAsElement(vit.templates.contestInfo, data);
  this.setElementInternal(element);
  var tabs = this.getElementByClass(
      goog.getCssName('scrolling-tab-bar-container'));
  this.tabContentElement_ = this.getElementByClass(
      goog.getCssName('contest-tab-content'));
  if (tabs) {
    var tabBar = new vit.component.ScrollingTabBar();
    this.addChild(tabBar);
    tabBar.decorate(tabs);
    this.tabBar_ = tabBar;

    var hoverCard = new goog.ui.AdvancedTooltip();
    hoverCard.setCursorTracking(true);
    this.registerDisposable(hoverCard);
    this.hoverCard_ = hoverCard;
  }
};


/**
 * Formats API data for use in the template.
 * @param {vit.api.CivicInfo.Response} civicInfo The civic info data.
 * @return {Object.<string, *>} Object containing info to render.
 * @private
 */
vit.component.ContestInfo.prototype.formatData_ = function(civicInfo) {
  return {
    addressWasEntered: civicInfo &&
        civicInfo.requestTrigger == vit.context.ADDRESS,
    contests: this.formatContests_(this.contests_)
  };
};


/**
 * Formats contest data for use in the template.
 * @param {Array.<vit.api.CivicInfo.Contest>} contests Contests to format.
 * @return {Array.<vit.api.CivicInfo.Contest>} Formatted Contests.
 * @private
 */
vit.component.ContestInfo.prototype.formatContests_ = function(contests) {
  /** @type {Array.<Object.<string, *>>} */
  var formattedContests = contests ? [] : null;
  var titleCaseExceptions = ['US'];
  if (this.region_) {
    titleCaseExceptions.push(this.region_);
  }
  if (contests) {
    for (var i = 0; i < contests.length; i++) {
      var formattedContest = {};
      var contest = contests[i];
      goog.object.extend(formattedContest, contest, {
        office: vit.util.selectiveTitleCase(contest.office, titleCaseExceptions)
      });
      formattedContests[i] = formattedContest;
    }
  }
  return formattedContests;
};


/**
 * Handles tab selection events.
 * @param {goog.events.Event} e The event object.
 * @private
 */
vit.component.ContestInfo.prototype.handleTabSelection_ = function(e) {
  var selectedTab = e.target;
  goog.dom.removeChildren(this.tabContentElement_);
  // TODO(jmwaura): Surely there's a better way to do this.
  var tabIndex = this.tabBar_.getSelectedTabIndex();
  var data = {candidates: this.contests_[tabIndex].candidates};
  goog.dom.appendChild(this.tabContentElement_,
      goog.soy.renderAsElement(vit.templates.candidates, data));
  var hoverCardTargets = goog.dom.getElementsByClass(
      goog.getCssName('candidate-contact'));
  goog.array.forEach(hoverCardTargets, function(el) {
      this.hoverCard_.attach(el);
  }, this);
};


/**
 * Called before a hover card is shown.
 * @param {goog.events.Event} e The event object.
 * @private
 */
vit.component.ContestInfo.prototype.onBeforeShowCard_ = function(e) {
  var card = /** @type {goog.ui.AdvancedTooltip} */ (e.target);
  var anchor = card.anchor;
  var data = {
    name: anchor.getAttribute('data-name'),
    url: anchor.getAttribute('data-url'),
    phone: anchor.getAttribute('data-phone'),
    email: anchor.getAttribute('data-email'),
    image: anchor.getAttribute('data-image')
  };
  card.setHtml(vit.templates.candidateCard(data));
};


/** @override */
vit.component.ContestInfo.prototype.disposeInternal = function() {
  this.context_ = null;
  this.contests_ = null;
  this.region_ = null;
  this.tabContentElement_ = null;
  this.tabSelectListenerKey_ = null;
  this.tabBar_ = null;

  goog.base(this, 'disposeInternal');
};


/** @override */
vit.component.ContestInfo.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  if (this.tabBar_) {
    this.getHandler().listen(
        this.tabBar_,
        goog.ui.Component.EventType.SELECT,
        this.handleTabSelection_
    );
    this.tabBar_.setSelectedTabIndex(0);
  }
  if (this.hoverCard_) {
    this.getHandler().listen(
        this.hoverCard_,
        goog.ui.PopupBase.EventType.BEFORE_SHOW,
        this.onBeforeShowCard_);
  }
};


/** @override */
vit.component.ContestInfo.prototype.exitDocument = function() {
  goog.base(this, 'exitDocument');
};
