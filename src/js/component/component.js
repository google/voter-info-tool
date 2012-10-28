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
 * @fileoverview Base component that fires document change events.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.component.Component');
goog.provide('vit.component.Component.EventType');

goog.require('goog.dom');
goog.require('goog.events.Event');
goog.require('goog.ui.Component');



/**
 * Base component that fires document change events.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper DOM helper to use.
 *
 * @extends {goog.ui.Component}
 * @constructor
 */
vit.component.Component = function(opt_domHelper) {
  goog.base(this, opt_domHelper);
};
goog.inherits(vit.component.Component, goog.ui.Component);


/** @override */
vit.component.Component.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.dispatchDocumentChangeEvent();
};


/**
 * Dispatches a document change event.
 * @protected
 */
vit.component.Component.prototype.dispatchDocumentChangeEvent = function() {
  this.dispatchEvent(new goog.events.Event(
    vit.component.Component.EventType.DOCUMENT_CHANGE, this));
};


/**
 * Common events fired by VIT components.
 * @enum {string}
 */
vit.component.Component.EventType = {
  DOCUMENT_CHANGE: 'vit.component.documentchange'
};
