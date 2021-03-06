/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/boot/04-sync.js
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
var chokidar = require('chokidar');
var path = require('path');
var Promise = require('bluebird');

module.exports = function(app) {

  var options = app.get('options');
  var locals = options.client;
  var webLocals = options.web;

  init(locals);
  init(webLocals);

  //////////////////////////////////////////////////////////

  function init(locals) {
    var project = locals.project;

    var watcher = chokidar.watch([
      // Project folders
      project.paths.source,
      project.paths.data,
      project.paths.config,
      // Theme folders
      project.paths.sourceTheme,
      project.paths.dataTheme,
      project.paths.configTheme,
    ], {
      ignoreInitial: true,
      ignored: /[/\\]\./
    });

    watcher.on('add', function(pathFile) {
      onWatcher(pathFile);
    });

    watcher.on('change', function(pathFile) {
      onWatcher(pathFile);
    });

    watcher.on('unlink', function(pathFile) {
      onWatcher(pathFile);
    });

    var updating = false;
    var queued = null;

    function onWatcher(pathFile) {

      if (updating) {
        queued = pathFile;
        return;
      }

      queued = null;
      updating = true;

      return onUpdate(pathFile)
        .then(function() {
          return Promise.delay(1000);
        })
        .then(function() {
          updating = false;
          if (queued) {
            return onWatcher(queued);
          }
        });
    }

    //////////////////////////////////////////////////////////

    function onUpdate(pathFile) {

      var params = path.parse(pathFile);

      switch (params.ext) {
        case '.yml':

          var promise = locals.main.load.pages();

          if (
            params.dir.indexOf(project.paths.dataTheme) === 0 ||
                        params.dir.indexOf(project.paths.data) === 0
          ) {
            locals.cache.data.invalidate(pathFile);
          }

          if (
            pathFile.indexOf(project.paths.configTheme) === 0 ||
                        pathFile.indexOf(project.paths.config) === 0
          ) {
            promise = promise.then(locals.main.load.config());
          }

          return promise
            .then(function() {
              project.call_listeners('ready');
            })
            .delay(100)
            .then(function() {
              reload();
            })
            .catch(function(error) {
              console.error(error);
            });

        case '.styl':
          reload();
          break;
        case '.js':
          reload();
          break;
        case '.ejs':
          locals.cache.templates.invalidate(pathFile);
          reload();
          break;
      }

      function reload() {
        //console.log('reload');
        app.portal.socket.emit('page-reload');
      }

      return Promise.resolve();
    }
  }

};
