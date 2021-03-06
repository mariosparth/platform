/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/boot/git/update.js
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
var nodegit = require('nodegit');
var path = require('path');

module.exports = function(app) {

  var config = app.get('git');

  app.git.update = function() {

    var repo = app.git.repository;
    var references;

    return repo.fetch(config.remote.name, {
      callbacks: {
        credentials: app.git.credentials,
        transferProgress: function(progress) {

          var percentage = (progress.receivedObjects() / progress.totalObjects()) * 100;
          console.log('Fetching from repository: ', percentage + '%');
        }
      }
    })
      .then(function() {
        return repo.getReferenceNames(nodegit.Reference.TYPE.LISTALL);

      })
      .then(function(_references) {
        references = _references;

        var branchName;

        return Promise.resolve()
          .then(function() {
            if (references.indexOf('refs/heads/master') >= 0) {
              return repo.getCurrentBranch()
                .then(function(reference) {
                  branchName = path.parse(reference.name()).name;
                });
            }
            branchName = 'master';
            return ensureBranch(branchName);
          })
          .then(function() {

            branchName = process.env.GIT_BRANCH || config.branch || branchName;
            if (branchName == 'master') {
              return;
            }
            return ensureBranch(branchName);

          });


      });

    function ensureBranch(branchName) {
      var remoteBranch = config.remote.name + '/' + branchName;
      var latestCommit;
      var reference;

      return repo.getBranch(remoteBranch)
        .then(function(branch) {
          return repo.getBranchCommit(branch);
        })
        .then(function(commit) {

          latestCommit = commit;

          console.log('latest-commit', {
            message: commit.message(),
            date: commit.date(),
            author: commit.author().email()
          });

          var refName = 'refs/heads/' + branchName;

          if (references.indexOf(refName) >= 0) {
            return repo.getReference(refName);
          }

          return repo.createBranch(branchName, commit);

        })
        .then(function(_reference) {
          reference = _reference;
          console.log('Setting up branch', reference.name());
          return app.git.addAll();
        })
        .then(function() {
          return repo.mergeBranches(
            reference,
            remoteBranch);
        })
        .then(function() {

          const STRATEGY = nodegit.Checkout.STRATEGY;

          return repo.checkoutBranch(reference, {
            checkoutStrategy: STRATEGY.ALLOW_CONFLICTS | STRATEGY.USE_THEIRS
          });
        })
        .then(function() {
          return nodegit.Reset.reset(repo, latestCommit, nodegit.Reset.TYPE.HARD);
        });
    }


  };
};
