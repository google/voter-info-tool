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
 * @fileoverview Accordion component that uses csszippies.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.Accordion');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.ui.Zippy');
goog.require('goog.ui.ZippyEvent');
goog.require('vit.component.Component');
goog.require('vit.component.CssZippy');



/**
 * Accordion component that uses CssZippies.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {vit.component.Component}
 * @constructor
 */
vit.component.Accordion = function(opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The header.
   * @type {Array.<vit.component.CssZippy>}
   * @private
   */
  this.zippies_;

  /**
   * The currently selected element.
   * @type {Element}
   * @private
   */
  this.selected_;
};
goog.inherits(vit.component.Accordion, vit.component.Component);


/** @override */
vit.component.Accordion.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);

  /** @type {Array.<vit.component.CssZippy>} */
  var zippies = [];
  var zippyEls = goog.dom.getElementsByClass(goog.getCssName('zippy'), element);
  goog.array.forEach(zippyEls, function(zippyEl) {
    var zippy = new vit.component.CssZippy(zippyEl);
    zippies.push(zippy);
  }, this);
  this.zippies_ = zippies;
};


/**
 * Handle zippy toggle events.
 * @param {goog.ui.ZippyEvent} ev Zippy toggle event.
 * @private
 */
vit.component.Accordion.prototype.onZippyToggle_ = function(ev) {
  if (!ev.expanded) {
    if (this.selected_ == ev.target.getElement()) {
      this.selected_ = null;
    } else {
      return;
    }
  } else {
    var expandedZippy = ev.target;
    goog.array.forEach(this.zippies_, function(zippy) {
      if (expandedZippy != zippy) {
        zippy.collapse();
      }
    });
    this.selected_ = ev.target.getElement();
  }
  this.dispatchEvent(new goog.events.Event(goog.ui.Component.EventType.SELECT,
      this));
};


/**
 * Gets selected zippy element.
 * @return {Element} The selected zippy element.
 */
vit.component.Accordion.prototype.getSelected = function() {
  return this.selected_;
};


/** @override */
vit.component.Accordion.prototype.enterDocument = function() {
  var handler = this.getHandler();
  goog.array.forEach(this.zippies_, function(zippy) {
    handler.listen(zippy, goog.ui.Zippy.Events.TOGGLE, this.onZippyToggle_);
  }, this);
};


/** @override */
vit.component.Accordion.prototype.exitDocument = function() {
  this.getHandler().removeAll();
};


/** @override */
vit.component.Accordion.prototype.disposeInternal = function() {
  goog.array.forEach(this.zippies_, function(zippy) {
    zippy.dispose();
  }, this);
  delete this.zippies_;

  goog.base(this, 'disposeInternal');
};
