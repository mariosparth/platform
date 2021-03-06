/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: services/server/config.js
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
module.exports = {
  restApiRoot: '/api',
  host: 'locahost',
  domain: 'locahost',
  token: {
    name: 'access_token'
  },
  roles: {
    administrator: {
      model: 'Role_Administrator'
    },
    reviewer: {
      model: 'Role_Reviewer'
    },
    editor: {
      model: 'Role_Editor'
    }
  },
  limiter: {
    global: {
      freeRetries: 100,
      attachResetToRequest: false,
      refreshTimeoutOnRequest: false,
      minWait: 10 * 60 * 1000,
      maxWait: 1 * 60 * 60 * 1000,
      lifetime: 10 * 60,
    }
  },
  search: {
    page: {
      models: {
        position: 'Search_Position',
        source: 'Search_Page',
        field: 'Search_Field',
        keyword: 'Search_Keyword'
      }
    }
  },
  remoting: {
    rest: {
      normalizeHttpPath: false,
      xml: false
    },
    json: {
      strict: false,
      limit: '100kb'
    },
    urlencoded: {
      extended: true,
      limit: '100kb'
    },
    cors: false
  },
  language: require('./config/language'),
  media: require('./config/media'),
  activities: require('./config/activities'),
  legacyExplorer: false
};
