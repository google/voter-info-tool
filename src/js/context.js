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
 * @fileoverview A key/value store that maintains application context
 *     and publishes notifications if any members change.
 * @author jmwaura@google.com (Jesse Mwaura)
 */

goog.provide('vit.context');
goog.provide('vit.context.ConfigName');
goog.provide('vit.context.Context');
goog.provide('vit.context.NoticeType');

goog.require('goog.Disposable');
goog.require('goog.object');
goog.require('goog.pubsub.PubSub');



/**
 * Constructs a key/value store to maintain context.
 * @constructor
 * @extends {goog.Disposable}
 */
vit.context.Context = function() {
  goog.base(this);

  /**
   * The stored data keyed by notification path.
   * @type {Object.<string, *>}
   * @private
   */
  this.backingMap_ = {};

  /**
   * PubSub object used to publish change events.
   * @type {goog.pubsub.PubSub}
   * @private
   */
  this.pubsub_ = new goog.pubsub.PubSub();
};
goog.inherits(vit.context.Context, goog.Disposable);


/**
 * Stores data at the given key.
 * @param {string} key Key at which to store data.
 * @param {*} value Data to store.
 */
vit.context.Context.prototype.set = function(key, value) {
  var old = goog.object.get(this.backingMap_, key);
  goog.object.set(this.backingMap_, key, value);
  this.publishChangeEvent(key, value, old);
};


/**
 * Gets data at the given key.
 * @param {string} key Key for which to get data.
 * @return {*} the value stored at the given key.
 */
vit.context.Context.prototype.get = function(key) {
  return goog.object.get(this.backingMap_, key);
};


/**
 * Removes data at the given key.
 * @param {string} key Key for which to remove data.
 * @return {boolean} Whether or not a value was removed.
 */
vit.context.Context.prototype.remove = function(key) {
  var old = goog.object.get(this.backingMap_, key);
  var removed = goog.object.remove(this.backingMap_, key);
  if (removed) {
    this.publishChangeEvent(key, undefined, old);
  }
  return removed;
};


/**
 * Subscribes a function to change notifications for a given key.
 * @param {string} key The key on which to listen for changes.
 * @param {Function} fn Function that will be called when a change occurs.
 * @param {Object=} opt_context Object in whose context the function is to be
 *     called (the global scope if none).
 * @return {number} Subscription ID.
 */
vit.context.Context.prototype.subscribe = function(key, fn, opt_context) {
  return this.pubsub_.subscribe(key, fn, opt_context);
};


/**
 * Unsubscribes a function from change notifications for a given key.
 * @param {string} key The key from which to unsubscribe.
 * @param {Function} fn Function that was previously subscribed to the key.
 * @param {Object=} opt_context Object in whose context the function was to
 *     be called (the global scope if none).
 * @return {boolean} Whether a matching subscription was removed.
 */
vit.context.Context.prototype.unsubscribe = function(key, fn,
    opt_context) {
  return this.pubsub_.unsubscribe(key, fn, opt_context);
};


/**
 * Removes a subscription based on a given subscription id.
 * @param {?number} subscriptionId Subscription ID.
 * @return {boolean} Whether a matching subscription was removed.
 */
vit.context.Context.prototype.unsubscribeById = function(subscriptionId) {
  if (goog.isDefAndNotNull(subscriptionId)) {
    return this.pubsub_.unsubscribeByKey(subscriptionId);
  }
  return false;
};


/**
 * Publish the change event with the new value.
 * @param {string} key Key that changed.
 * @param {*} newValue New value at given key.
 * @param {*} oldValue Old value at the given key.
 * @protected
 */
vit.context.Context.prototype.publishChangeEvent = function(key, newValue,
    oldValue) {
  this.pubsub_.publish(key, newValue, oldValue);
};


/**
 * @override
 */
vit.context.Context.prototype.disposeInternal = function() {
  this.pubsub_.dispose();
  goog.object.clear(this.backingMap_);
  this.backingMap_ = null;

  goog.base(this, 'disposeInternal');
};


/**
 * The ready state of the application.
 * @type {string}
 * @const
 */
vit.context.READY = 'ready';


/**
 * The input address to be used for lookup.
 * @type {string}
 * @const
 */
vit.context.ADDRESS = 'address';


/**
 * The currently selected state.
 * @type {string}
 * @const
 */
vit.context.REGION = 'region';


/**
 * The information returned by the last lookup.
 * @type {string}
 * @const
 */
vit.context.CIVIC_INFO = 'civic_info';


/**
 * The last published notice.
 * @type {string}
 * @const
 */
vit.context.NOTICE = 'notice';


/**
 * The referring page or parent iframe.
 */
vit.context.REFERRER = 'referrer';


/**
 * Type of notice.
 * @enum {string}
 */
vit.context.NoticeType = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};


/**
 * Type definition of a notice.
 * @typedef {{
 *   type: vit.context.NoticeType,
 *   title: string,
 *   desc: string
 * }}
 */
vit.context.Notice;


/**
 * The last published configuration.
 * @type {string}
 * @const
 */
vit.context.CONFIG = 'config';


/**
 * The last reported address entry string.
 * @type {string}
 * @const
 */
vit.context.ADDRESS_ENTRY = 'address_entry';


/**
 * The last address suggestion.
 * @type {string}
 * @const
 */
vit.context.ADDRESS_SUGGESTION = 'address_suggestion';


/**
 * Type of config.
 * @enum {string}
 */
vit.context.ConfigName = {
  ELECTION_ID: 'election_id',
  OFFICIAL_ONLY: 'official_only',
  ADDRESS: 'address',
  REGION: 'region'
};
