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
 * @fileoverview Simplified interface for Google API Javascript Client.
 * @author jmwaura@google.com (Jesse Mwaura)
 */

goog.provide('vit.api');
goog.provide('vit.api.Api');

goog.require('goog.Disposable');
goog.require('goog.math.ExponentialBackoff');



/**
 * Construct wrapper for Google API client.
 * @constructor
 * @extends {goog.Disposable}
 */
vit.api.Api = function() {
  goog.base(this);
  if (vit.api.API_KEY) {
    gapi.client.setApiKey(vit.api.API_KEY);
  } else {
    throw Error('No Google API Key configured.');
  }
};
goog.inherits(vit.api.Api, goog.Disposable);


/**
 * Build request arguments and initiate a request. If the request fails, it
 * will be retried vit.api.NUM_RETRIES times.
 * @param {string} path API path.
 * @param {string} method HTTP request method.
 * @param {Object.<string, string>} params API request parameters.
 * @param {Object.<string, string>} body API request body.
 * @param {function((!Object|boolean), string)} callback Callback function. Must
 *     already be bound to the appropriate scope, otherwise it will be executed
 *     in the global scope.
 */
vit.api.Api.prototype.request = function(path, method, params, body,
    callback) {
  var args = {
    'path': path,
    'method': method,
    'params': params
  };
  if (method == vit.api.POST || method == vit.api.PUT) {
    args['body'] = body;
  }
  this.request_(args, callback);
};


/**
 * Build and execute a request.
 * @param {!Object} args Request arguments.
 * @param {function((!Object|boolean), string)} callback Callback function.
 * @param {goog.math.ExponentialBackoff=} opt_backoff Backoff counter.
 * @private
 */
vit.api.Api.prototype.request_ = function(args, callback, opt_backoff) {
  /** @type {!gapi.client.HttpRequest|undefined} */
  var req = gapi.client.request(args);
  if (req) {
    req.execute(
        goog.bind(this.handleResponses_, this, args, callback, opt_backoff));
  } else {
    throw Error('gapi did not return a proper request object.');
  }
};


/**
 * Handle responses. Retry and back off when errors are encountered.
 * @param {!Object} args Request arguments.
 * @param {function((!Object|boolean), string)} callback The callback for this
 *     request. Must already be bound to its scope.
 * @param {goog.math.ExponentialBackoff} backoff Backoff counter.
 * @param {!Object|boolean} jsonResp The parsed JSON response from the api.
 * @param {string} rawResp Raw HTTP response in a JSON encoded string.
 *     @see https://code.google.com/p/google-api-javascript-client/wiki/ReferenceDocs#gapi.client._RpcRequest
 * @private
 */
vit.api.Api.prototype.handleResponses_ = function(args, callback,
    backoff, jsonResp, rawResp) {
  if (!jsonResp) {
    // TODO(jmwaura): Parse raw response and only retry on transient errors.
    if (!goog.isDefAndNotNull(backoff)) {
      backoff = new goog.math.ExponentialBackoff(vit.api.MIN_RETRY_DELAY,
          vit.api.MAX_RETRY_DELAY);
    } else {
      backoff.backoff();
    }
    if (backoff.getBackoffCount() > vit.api.NUM_RETRIES) {
      callback(jsonResp, rawResp);
    } else {
      setTimeout(goog.bind(this.request_, this, args, callback, backoff),
          backoff.getValue());
    }
  } else {
    callback(jsonResp, rawResp);
  }
};


/**
 * POST request type.
 * @type {string}
 * @const
 */
vit.api.POST = 'POST';


/**
 * GET request type.
 * @type {string}
 * @const
 */
vit.api.GET = 'GET';


/**
 * PUT request type.
 * @type {string}
 * @const
 */
vit.api.PUT = 'PUT';


/**
 * Number of times to retry a failed request.
 * @type {number}
 * @const
 */
vit.api.NUM_RETRIES = 5;


/**
 * Minimum delay in ms between retry attempts.
 * @type {number}
 * @const
 */
vit.api.MIN_RETRY_DELAY = 100;


/**
 * Maximum delay in ms between retry attempts.
 * @type {number}
 * @const
 */
vit.api.MAX_RETRY_DELAY = 3200;


/**
 * An API Key is required to access Google Maps and Civic Information APIs.
 * @define {string} Google API Key.
 */
vit.api.API_KEY = '';
