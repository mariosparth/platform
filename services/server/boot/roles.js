/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: services/server/boot/roles.js
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
module.exports = function(app) {


  function setRoles(Account, roles) {

    var Role = app.models.Role;

    for (var name in roles) {
      var role = roles[name];
      var model = app.models[role.model];

      model.belongsTo(Account, {
        foreignKey: 'accountId',
        as: 'account'
      });

      model.validatesUniquenessOf('accountId');

      Account.hasOne(model, {
        foreignKey: 'accountId',
        as: name
      });

      Role.registerResolver(name, checkRole);

    }

    function checkRole(role, context, cb) {
      cb(null, context.accessToken && context.accessToken.roles && context.accessToken.roles[role]);
    }

  }

  setRoles(app.models.Account, app.get('roles'));

  app.helpers.setRoles = setRoles;

};
