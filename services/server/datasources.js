/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: services/server/datasources.js
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
var _ = require('lodash');

module.exports = function(app) {

  var db = app.get('db');

  var result = {
    db: _.extend({
      name: 'db',
      connector: 'mongodb'
    }, db)
  };

  return result;
};
