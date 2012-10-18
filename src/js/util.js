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
 * @fileoverview Generally useful utility methods.
 * @author jmwaura@google.com (Jesse Mwaura)
 */
goog.provide('vit.util');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.object');
goog.require('goog.string');


/**
 * Selectively changes text to title-case. Will not modify mixed case strings.
 * Words in exception list are uppercased.
 * @param {string} str String value.
 * @param {Array.<string>=} opt_except Substring words to avoid replacing.
 * @return {string} Title-case string.
 */
vit.util.selectiveTitleCase = function(str, opt_except) {
  if (!(str == str.toUpperCase() || str == str.toLowerCase())) {
    // String is mixed case. Bail.
    return str;
  }
  str = goog.string.toTitleCase(str.toLowerCase());
  if (!opt_except) {
    return str;
  }

  var exceptions = goog.array.map(opt_except, function(val) {
    return goog.string.regExpEscape(val);
  });

  var re = new RegExp('(^|\\s)(' + exceptions.join('|') + ')($|\\s)', 'gi');
  return str.replace(re, function(all, before, exception, after) {
    return before + exception.toUpperCase() + after;
  });
};


/**
 * Generates a random string suitable for use as an identifier.
 * @return {string} Random string.
 */
vit.util.generateIdentifier = function() {
  return 'i' + Math.random().toString(36).substring(2);
};


/**
 * Loads dependency javascript files in parallel.
 * @param {Array.<{uri: goog.Uri, callbackParam: string}>} uriList The list of
 *     URIs to load and the parameter to use to specify the callback.
 * @param {Function} callback The method to call when all files are loaded.
 * TODO(jmwaura): Handle errors and support URIs that don't take callbacks.
 */
vit.util.load = function(uriList, callback) {
  var uriMap = {};
  for (var i = 0; i < uriList.length; i++) {
    var uri = uriList[i].uri;
    var callbackParam = uriList[i].callbackParam || 'callback';
    var identifier = vit.util.generateIdentifier();
    while (uriMap[identifier] || window[identifier]) {
      identifier = vit.util.generateIdentifier();
    }
    uri.setParameterValue(callbackParam, identifier);
    uriMap[identifier] = uri;
  }
  var fn = function(uriMap, identifier, callback) {
    delete uriMap[identifier];
    try {
      delete window[identifier];
    } catch (e) {
      // Window properties can not be deleted in IE8.
      window[identifier] = undefined;
    }
    if (goog.object.isEmpty(uriMap)) {
      callback();
    }
  };
  goog.object.forEach(uriMap, function(uri, identifier) {
    // Add callback to global scope.
    window[identifier] = goog.partial(fn, uriMap, identifier, callback);

    // Add script tag to head.
    var script = goog.dom.createElement(goog.dom.TagName.SCRIPT);
    goog.dom.setProperties(script, {
      'type': 'text/javascript',
      'charset': 'UTF-8',
      'src': uri.toString()
    });
    var headEls = document.getElementsByTagName(goog.dom.TagName.HEAD);
    var head = null;
    if (!headEls || goog.array.isEmpty(headEls)) {
      head = document.documentElement;
    } else {
      head = headEls[0];
    }
    head.appendChild(script);
  });
};


/**
 * Adds 'disabled' and 'enabled' css classes to elements.
 * @param {Element} el Element to add classes to.
 * @param {boolean} enabled Whether element should be enabled.
 */
vit.util.setCssEnabled = function(el, enabled) {
  if (enabled) {
    goog.dom.classes.addRemove(el, goog.getCssName('disabled'),
        goog.getCssName('enabled'));
  } else {
    goog.dom.classes.addRemove(el, goog.getCssName('enabled'),
        goog.getCssName('disabled'));
  }
};
