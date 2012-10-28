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
 * @fileoverview Zippy component that uses css transitions for animation.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.CssZippy');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.ui.Zippy');
goog.require('goog.ui.ZippyEvent');



/**
 * Zippy component that relies on CSS transitions for animation.
 *
 * @param {Element|string} zippy The zippy element or id.
 *
 * @extends {goog.ui.Zippy}
 * @constructor
 */
vit.component.CssZippy = function(zippy) {
  // Wrap the content element.
  var contentWrapperEl = goog.dom.createDom('div',
      {'style': 'overflow:hidden; display:none;'});
  var zippyEl = goog.dom.getElement(zippy);
  var isExpanded = goog.dom.classes.has(zippyEl, goog.getCssName('expanded'));
  var contentEl = goog.dom.getElementByClass(
      goog.getCssName('zippy-content'), zippyEl);
  zippyEl.replaceChild(contentWrapperEl, contentEl);
  contentWrapperEl.appendChild(contentEl);

  var headerEl = goog.dom.getElementByClass(
      goog.getCssName('zippy-header'), zippyEl);

  goog.base(this, headerEl, contentEl, isExpanded);

  /**
   * The zippy element.
   * @type {Element}
   * @private
   */
  this.zippyEl_ = zippyEl;

   /**
   * The header.
   * @type {Element}
   * @private
   */
  this.headerEl_ = headerEl;

  /**
   * The content wrapper.
   * @type {Element}
   * @private
   */
  this.contentWrapperEl_ = contentWrapperEl;

  /**
   * The timeout to fire at the end of transition animations.
   * @type {?number}
   * @private
   */
  this.transitionEndTimeout_ = null;

  this.init_(isExpanded);
};
goog.inherits(vit.component.CssZippy, goog.ui.Zippy);


/**
 * Animation duration in ms.
 * @const {number}
 */
vit.component.CssZippy.ANIMATION_DURATION = 200;


/**
 * Animation delay in ms.
 * @const {number}
 */
vit.component.CssZippy.ANIMATION_DELAY = 50;


/**
 * Initialize the zippy.
 * @param {boolean} expanded Whether to start out expanded.
 * @private
 */
vit.component.CssZippy.prototype.init_ = function(expanded) {
  // Display the element if necessary.
  if (expanded) {
    this.contentWrapperEl_.style.display = '';
  }

  // Wait for the element to render, then measure the content height and
  // explicitly set the size. This will allow the first animation to
  // happen smoothly. Also set the transition properties.
  setTimeout(goog.bind(function() {
    var height = this.getContentElement().offsetHeight;
    var contentWrapperEl = this.contentWrapperEl_;
    contentWrapperEl.style.height = height + 'px';

    // TODO(jmwaura): Move these to a css class.
    var transition = 'height ' + vit.component.CssZippy.ANIMATION_DURATION +
        'ms';
    contentWrapperEl.style.transition = transition;
    contentWrapperEl.style.WebkitTransition = transition;
    contentWrapperEl.style.MozTransition = transition;
    contentWrapperEl.style.OTransition = transition;
  }, this), vit.component.CssZippy.ANIMATION_DELAY);
};


/** @override */
vit.component.CssZippy.prototype.setExpanded = function(expanded) {
  // This effectively disables the initial run by the superclass constructor.
  if (this.isExpanded() == expanded) {
    return;
  }

  // Clear active timeout if any.
  clearTimeout(this.transitionEndTimeout_);

  var contentWrapperEl = this.contentWrapperEl_;

  // Display the element.
  if (expanded) {
    contentWrapperEl.style.display = '';
  }

  setTimeout(goog.bind(function() {
    if (expanded) {
      var contentHeight = this.getContentElement().offsetHeight;
      // In case the height can't be determined, just clear the 0px height.
      contentWrapperEl.style.height = contentHeight ? contentHeight + 'px' : '';
    } else {
      contentWrapperEl.style.height = '0px';
      // Wait for transition to end before setting the display property to none.
      this.transitionEndTimeout_ = setTimeout(goog.bind(function() {
        this.contentWrapperEl_.style.display = 'none';
      }, this), vit.component.CssZippy.ANIMATION_DURATION);
    }
  }, this), vit.component.CssZippy.ANIMATION_DELAY);

  goog.dom.classes.enable(this.zippyEl_, goog.getCssName('expanded'),
      expanded);

  this.setExpandedInternal(expanded);

  this.dispatchEvent(new goog.ui.ZippyEvent(goog.ui.Zippy.Events.TOGGLE,
      this, expanded));
};


/** @override */
vit.component.CssZippy.prototype.disposeInternal = function() {
  delete this.contentWrapperEl_;
  delete this.zippyEl_;
  delete this.headerEl_;
  clearTimeout(this.transitionEndTimeout_);
  this.transitionEndTimeout_ = null;
  goog.base(this, 'disposeInternal');
};


/**
 * Returns the DOM element associated with this zippy.
 * @return {Element} The DOM element associated with this zippy.
 */
vit.component.CssZippy.prototype.getElement = function() {
  return this.zippyEl_;
};


/**
 * Sets the enabled state of the zippy. A disabled zippy will not handle user
 * input but will otherwise behave as expected.
 * @param {boolean} enabled Whether or not the zippy should be enabled.
 */
vit.component.CssZippy.prototype.setEnabled = function(enabled) {
  this.setHandleMouseEvents(enabled);
  this.setHandleKeyboardEvents(enabled);
};
