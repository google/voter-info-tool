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
 * @fileoverview Component that handles the address input dialog.
 * @author jmwaura@google.com (Jesse Mwaura)
 * TODO(jmwaura): This component expects to be disposed whenever its elements
 *     are removed from the dom. Clean up the event handling so that this is not
 *     the case.
 */
goog.provide('vit.component.AddressDialog');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.forms');
goog.require('goog.dom.selection');
goog.require('goog.events');
goog.require('goog.events.FocusHandler');
goog.require('goog.events.InputHandler');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('goog.soy');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component');
goog.require('vit.component.RegionSelector');
goog.require('vit.templates.addressDialog');



/**
 * Component that manages address input dialog.
 * @param {vit.context.Context} context The application context.
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 * @extends {goog.ui.Component}
 * @constructor
 */
vit.component.AddressDialog = function(context, opt_domHelper) {
  goog.base(this, opt_domHelper);

  /**
   * The application context context.
   * @type {vit.context.Context}
   * @private
   */
  this.context_ = context;

  /**
   * Address text box element.
   * @type {Element}
   * @private
   */
  this.addressBox_;

  /**
   * Autocomplete suggestion element.
   * @type {Element}
   * @private
   */
  this.autocompleteBox_;

  /**
   * Suggestion listener.
   * @type {?number}
   * @private
   */
  this.suggestionListener_;

  /**
   * Key handler.
   * @type {goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_;

  /**
   * Focus handler.
   * @type {goog.events.FocusHandler}
   * @private
   */
  this.focusHandler_;

  /**
   * Input handler.
   * @type {goog.events.InputHandler}
   * @private
   */
  this.inputHandler_;
};
goog.inherits(vit.component.AddressDialog, goog.ui.Component);


/** @override */
vit.component.AddressDialog.prototype.createDom = function() {
  var element = goog.soy.renderAsElement(vit.templates.addressDialog);
  this.setElementInternal(element);

  var regionSelector = new vit.component.RegionSelector(this.context_);
  this.addChild(regionSelector);
  regionSelector.decorate(
      this.getElementByClass(goog.getCssName('region-selector'))
  );

  var searchButton = new goog.ui.Button(null);
  this.addChild(searchButton);
  searchButton.decorate(
      this.getElementByClass(goog.getCssName('address-search-button'))
  );
  this.getHandler().listen(searchButton, goog.ui.Component.EventType.ACTION,
      this.submit_);

  this.addressBox_ = this.getElementByClass(goog.getCssName('address-input'));
  this.autocompleteBox_ =
      this.getElementByClass(goog.getCssName('address-autocomplete'));
  this.keyHandler_ = this.keyHandler_ || new goog.events.KeyHandler();
  this.registerDisposable(this.keyHandler_);
};


/**
 * Submit the address.
 * @private
 */
vit.component.AddressDialog.prototype.submit_ = function() {
  this.context_.set(vit.context.ADDRESS,
      goog.dom.forms.getValue(this.addressBox_));
};


/** @override */
vit.component.AddressDialog.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.suggestionListener_ = this.context_.subscribe(
      vit.context.ADDRESS_SUGGESTION,
      goog.bind(this.handleSuggestion_, this)
  );

  this.keyHandler_.attach(this.addressBox_);
  this.getHandler().listen(
      this.keyHandler_,
      goog.events.KeyHandler.EventType.KEY,
      this.handleKeyEvents_
  );

  this.focusHandler_ = new goog.events.FocusHandler(this.addressBox_);
  this.getHandler().listen(this.focusHandler_,
      goog.events.FocusHandler.EventType.FOCUSIN, this.handleInput_);

  this.inputHandler_ = new goog.events.InputHandler(this.addressBox_);
  this.getHandler().listen(this.inputHandler_,
      goog.events.InputHandler.EventType.INPUT, this.handleInput_);
};


/**
 * Handle Key events.
 * @param {goog.events.BrowserEvent} e The event.
 * @private
 */
vit.component.AddressDialog.prototype.handleKeyEvents_ = function(e) {
  var el = /** @type Element */ (e.target);
  var value = goog.dom.forms.getValue(el);
  var suggestion = goog.dom.forms.getValue(this.autocompleteBox_);
  if (e.keyCode == goog.events.KeyCodes.ENTER) {
    this.submit_();
  } else if ((e.keyCode == goog.events.KeyCodes.TAB ||
      e.keyCode == goog.events.KeyCodes.RIGHT) &&
      goog.dom.selection.getStart(el) >= value.length &&
      suggestion.lastIndexOf(value, 0) == 0) {
    // TODO(jmwaura): Handle RTL languages.
    goog.dom.forms.setValue(el, suggestion);
  }
};


/**
 * Handle Input.
 * @param {goog.events.BrowserEvent} e The event.
 * @private
 */
vit.component.AddressDialog.prototype.handleInput_ = function(e) {
  var el = /** @type Element */ (e.target);
  var value = goog.dom.forms.getValue(el);
  this.context_.set(vit.context.ADDRESS_ENTRY, value);
};


/**
 * Handle suggestions.
 * @param {?string} suggestion The suggestion.
 * @private
 */
vit.component.AddressDialog.prototype.handleSuggestion_ = function(suggestion) {
  goog.dom.forms.setValue(this.autocompleteBox_,
      /** @type {string} */ (suggestion) || '');
};


/** @override */
vit.component.AddressDialog.prototype.exitDocument = function() {
  this.focusHandler_.dispose();
  this.focusHandler_ = null;
  this.inputHandler_.dispose();
  this.inputHandler_ = null;
  this.keyHandler_.detach();
  this.context_.unsubscribeById(this.suggestionListener_);
  goog.base(this, 'exitDocument');
};


/** @override */
vit.component.AddressDialog.prototype.disposeInternal = function() {
  this.context_ = null;

  goog.base(this, 'disposeInternal');
};
