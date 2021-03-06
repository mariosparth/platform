/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/remotes/utility/stop.js
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
var Promise = require('bluebird');

module.exports = function(Model) {

  Model.stop = function(name) {
    return Model.getUtility(name)
      .then(function(utility) {
        var instance = utility.instance;
        if (!instance.status.running) {
          return Promise.reject({
            statusCode: 400,
            message: 'Instance has already stopped'
          });
        }

        instance.promise.cancel();
        instance.status.running = false;
        utility.emit('status', instance.status);

        return {
          success: 'Instance has stopped running'
        };
      });
  };

  Model.remoteMethod(
    'stop', {
      description: 'Stop a utility',
      accepts: [{
        arg: 'name',
        type: 'string',
        required: true
      }],
      returns: {
        arg: 'result',
        type: 'object',
        root: true
      },
      http: {
        verb: 'post',
        path: '/stop'
      }
    });


};
