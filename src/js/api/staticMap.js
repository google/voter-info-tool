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

goog.provide('vit.api.StaticMap');

goog.require('goog.Uri');
goog.require('vit.api');


/**
 * Static map api URL.
 * @type {string}
 * @const
 */
vit.api.StaticMap.URL = 'https://maps.googleapis.com/maps/api/staticmap';


/**
 * Generate a static maps URL.
 * @param {string} center Map center.
 * @param {boolean=} opt_addMarker Whether or not to add a marker at the center.
 * @param {string=} opt_size Size of the map image, e.g. '240x240'.
 * @return {string} The map URL.
 */
vit.api.StaticMap.generateMapUrl = function(center, opt_addMarker, opt_size) {
  var options = {
    'center': center,
    'size': opt_size || '384x216',
    'sensor': 'false',
    'key': vit.api.API_KEY
  };
  if (opt_addMarker) {
    options['markers'] = 'color:green|' + center;
    options['zoom'] = '14';
  }
  return new goog.Uri(vit.api.StaticMap.URL).setQueryData(
      goog.Uri.QueryData.createFromMap(options)).toString();
};
