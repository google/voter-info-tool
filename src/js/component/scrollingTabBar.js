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
 * @fileoverview Component that manages scrolling tabs.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.ScrollingTabBar');

goog.require('goog.soy');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.TabBar');
goog.require('vit.component.Component');
goog.require('vit.util');


/**
 * Create contest info component.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {vit.component.Component}
 * @constructor
 */
vit.component.ScrollingTabBar = function(opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * Tab Bar component.
   * @type {goog.ui.TabBar}
   * @private
   */
  this.tabBar_;

  /**
   * Tab bounds array. The bounds for tab index i are tabBounds_[i] and
   * tabBounds_[i+1].
   * @type {Array.<number>}
   * @private
   */
  this.tabBounds_;

  /**
   * Left button.
   * @type {goog.ui.Button}
   * @private
   */
  this.leftButton_;

  /**
   * Right button.
   * @type {goog.ui.Button}
   * @private
   */
  this.rightButton_;
};
goog.inherits(vit.component.ScrollingTabBar, vit.component.Component);


/**
 * Additional padding in px from the edge of the tab viewport.
 * @type {number}
 * @const
 */
vit.component.ScrollingTabBar.VIEWPORT_PADDING = 30;


/** @override */
vit.component.ScrollingTabBar.prototype.decorateInternal = function(element) {
  this.setElementInternal(element);
  var tabBarEl = this.getElementByClass(goog.getCssName('goog-tab-bar'));
  if (!tabBarEl) {
    return;
  }

  var tabBar = new goog.ui.TabBar();
  this.addChild(tabBar);
  tabBar.decorate(tabBarEl);
  this.tabBar_ = tabBar;

  this.getHandler().listen(
      this.tabBar_,
      goog.ui.Component.EventType.SELECT,
      this.handleTabSelection_);

  var leftButton = new goog.ui.Button(null);
  this.addChild(leftButton);
  leftButton.decorate(this.getElementByClass(
      goog.getCssName('scrolling-tab-bar-left-btn')));
  this.getHandler().listen(
      leftButton,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.handleScrollButtonAction_, this, 0.5));
  this.leftButton_ = leftButton;

  var rightButton = new goog.ui.Button(null);
  this.addChild(rightButton);
  rightButton.decorate(this.getElementByClass(
      goog.getCssName('scrolling-tab-bar-right-btn')));
  this.getHandler().listen(
      rightButton,
      goog.ui.Component.EventType.ACTION,
      goog.bind(this.handleScrollButtonAction_, this, -0.5));
  this.rightButton_ = rightButton;
};


/**
 * Gets the index of the selected tab.
 * @return {number} The selected tab index.
 */
vit.component.ScrollingTabBar.prototype.getSelectedTabIndex = function() {
  return this.tabBar_.getSelectedTabIndex();
};


/**
 * Gets the index of the selected tab.
 * @param {number} index Index of tab to select.
 */
vit.component.ScrollingTabBar.prototype.setSelectedTabIndex = function(index) {
  this.tabBar_.setSelectedTabIndex(index);
};


/**
 * Handles tab selection events.
 * @param {goog.events.Event} e The event object.
 * @private
 */
vit.component.ScrollingTabBar.prototype.handleTabSelection_ = function(e) {
  var selectedTab = /** @type {goog.ui.Component}*/ e.target;
  var tabIndex = this.tabBar_.getSelectedTabIndex();
  this.fitTab_(tabIndex);
};

/**
 * Handles left button actions.
 * @param {number} distance The distance to scroll as a fraction of the
 *   viewport width.
 * @param {goog.events.Event} e The event object.
 * @private
 */
vit.component.ScrollingTabBar.prototype.handleScrollButtonAction_ =
    function(distance, e) {
  var viewportWidth =
      this.getElementByClass(goog.getCssName('scrolling-tab-bar-viewport'))
      .clientWidth;
  var tabWidth = this.tabBounds_[this.tabBounds_.length - 1];
  var left = this.tabBar_.getElement().offsetLeft;
  left = left + (distance * viewportWidth);
  left = Math.min(0, Math.max(left, viewportWidth - tabWidth));
  goog.style.setStyle(this.tabBar_.getElement(), 'left', left + 'px');
  this.updateButtonEnabledState_(left, tabWidth, viewportWidth);
};


/**
 * Updates the enabled state of the buttons.
 * @param {number} left The left offset of the tab bar.
 * @param {number} tabBarWidth The width of the tab bar.
 * @param {number} viewportWidth The width of the viewport.
 * @private
 */
vit.component.ScrollingTabBar.prototype.updateButtonEnabledState_ =
    function(left, tabBarWidth, viewportWidth) {
  var enableLeft = left < 0;
  this.leftButton_.setEnabled(enableLeft);
  vit.util.setCssEnabled(this.leftButton_.getElement(), enableLeft);

  var enableRight = (viewportWidth - left) < tabBarWidth;
  this.rightButton_.setEnabled(enableRight);
  vit.util.setCssEnabled(this.rightButton_.getElement(), enableRight);
};


/**
 * Returns the left offset that will allow a tab to fit in the viewport.
 * @param {number} tabIndex Index of the selected tab.
 * @private
 */
vit.component.ScrollingTabBar.prototype.fitTab_ = function(tabIndex) {
  if (!this.tabBounds_) {
    this.tabBounds_ = this.measureTabBounds();
  }
  var tabLeft = this.tabBounds_[tabIndex];
  var tabRight = this.tabBounds_[tabIndex + 1];

  var tabWidth = this.tabBounds_[this.tabBounds_.length - 1];
  var viewportWidth = this.getElementByClass('scrolling-tab-bar-viewport')
      .clientWidth;

  var viewportBoundLeft = 0 - this.tabBar_.getElement().offsetLeft;
  var viewportBoundRight = viewportBoundLeft + viewportWidth;

  var left;
  if (tabLeft < viewportBoundLeft) {
    var newOffset = vit.component.ScrollingTabBar.VIEWPORT_PADDING - tabLeft;
    left = Math.min(0, newOffset);
  } else if (tabRight > viewportBoundRight) {
    var newOffset = viewportWidth -
        vit.component.ScrollingTabBar.VIEWPORT_PADDING - tabRight;
    left = Math.max(viewportWidth - tabWidth, newOffset);
  } else {
    left = -viewportBoundLeft;
  }
  goog.style.setStyle(this.tabBar_.getElement(), 'left', left + 'px');
  this.updateButtonEnabledState_(left, tabWidth, viewportWidth);
};


/**
 * Measures tab bounds and returns them as an array.
 * @return {Array.<number>} The left offset.
 */
vit.component.ScrollingTabBar.prototype.measureTabBounds = function() {
  var tabBarEl = this.tabBar_.getElement();
  var tabEls = goog.dom.getChildren(this.tabBar_.getElement());
  var position = 0;
  var tabCount = tabEls.length;
  var tabBounds = [];
  // Rather than try to calculate the outer width, use the difference between
  // sum of client widths and client width of container. This assumes all tabs
  // have the same margins and borders and that container has no padding. Also
  // assumes no properties will change that will affect the tab widths.
  //
  for (var i = 0; i < tabCount; i++) {
    tabBounds.push(position);
    position += tabEls[i].clientWidth;
  }
  var containerWidth = tabBarEl.clientWidth;
  var offset = Math.floor((containerWidth - position) / tabCount);

  for (var i = 0; i < tabCount; i++) {
    tabBounds[i] = tabBounds[i] + (i * offset);
  }

  // Add the container width so that it is possible to determine the bounds of
  // every element from the array.
  tabBounds.push(containerWidth - offset);
  return tabBounds;
};


/** @override */
vit.component.ScrollingTabBar.prototype.disposeInternal = function() {
  this.tabBar_ = null;
  this.tabBounds_ = null;
  this.leftButton_ = null;
  this.rightButton_ = null;

  goog.base(this, 'disposeInternal');
};
