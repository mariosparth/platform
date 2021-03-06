/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: theme/source/main.js
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

/*global _e_helpers:true*/

/*global _e_searchEngine*/
/*global _e_Route*/
/*global _e_Form*/
/*global _e_Scroll*/
/*global _e_Dialog*/
/*global _e_menuSide*/

(function() {


  var agneta = window.agneta;
  var app = window.angular.module('MainApp', window.angularDeps);

  _t_template('main/helpers');
  _e_helpers();

  app.config(function($mdThemingProvider, $sceDelegateProvider) {

    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      agneta.services.url + '/**',
      agneta.server.media + '/**',
      agneta.server.lib + '/**'
    ]);

    //////////////////////////////////////////////////////////////
    // Theme
    //////////////////////////////////////////////////////////////

    function definePalette(name, color) {

      var lum = agneta.colorLuminance;

      $mdThemingProvider.definePalette(name, {
        '50': lum(color, -0.5),
        '100': lum(color, -0.4),
        '200': lum(color, -0.3),
        '300': lum(color, -0.2),
        '400': lum(color, -0.1),
        '500': lum(color, 0),
        '600': lum(color, 0.05),
        '700': lum(color, 0.1),
        '800': lum(color, 0.15),
        '900': lum(color, 0.2),
        'A100': lum(color, 0.25),
        'A200': lum(color, 0.3),
        'A400': lum(color, 0.25),
        'A700': lum(color, 0.3),
        'contrastDefaultColor': 'light', // whether, by default, text (contrast)
        // on this palette should be dark or light
        'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
          '200', '300', '400', 'A100'
        ],
        'contrastLightColors': undefined // could also specify this if default was 'dark'
      });

    }

    definePalette('primary', agneta.theme.primary);
    definePalette('accent', agneta.theme.accent);

    $mdThemingProvider.theme('default')
      .primaryPalette('primary')
      .accentPalette('accent', {
        default: '500'
      })
      .warnPalette('red');

  }).controller('AppCtrl', function($scope, $mdMedia, $http, Account, $rootScope, $ocLazyLoad, $route, $timeout, $location, $mdSidenav, $q, $log, $mdDialog) {

    $location.path(agneta.url(agneta.path), false);

    ////////////////////////////////////////////////////////////////


    $scope.$mdMedia = $mdMedia;

    $rootScope.mediaClass = function() {
      var result = [];
      var check = ['xs', 'sm', 'md', 'gt-xs', 'gt-sm', 'gt-md'];
      for (var key in check) {
        var item = check[key];
        if ($mdMedia(item)) {
          result.push('media-' + item);
        }
      }
      return result.join(' ');
    };

    ////////////////////////////////////////////////////////////////

    $rootScope.modalFrame = function(source) {

      $mdDialog.open({
        data: {
          source: source
        },
        partial: 'iframe'
      });

    };

    ////////////////////////////////////////////////////////////////
    $rootScope.playVideo = function(sources) {

      $rootScope.dialog({
        partial: 'video',
        data: {
          sources: sources
        }
      });

    };

    ////////////////////////////////////////////////////////////////

    $rootScope.pageTitle = function() {
      if (!$rootScope.viewData) {
        return agneta.title;
      }
      return agneta.title + ' | ' + $rootScope.viewData.title;
    };

    ////////////////////////////////////////////////////////////////

    $rootScope.loadData = function(path) {

      var params = $route.current.params;
      path = path || params.path;

      var dataPath = agneta.urljoin({
        path: [agneta.services.view, path, 'view-data'],
        query: {
          version: agneta.page.version
        }
      });

      var data;

      return $http.get(dataPath)
        .then(function(response) {

          data = response.data;

          //----------------------------------------------

          var files = [];

          files = files.concat(data.scripts, data.styles);

          return $q(function(resolve) {

            if (files.length) {

              $ocLazyLoad.load([{
                serie: true,
                name: 'MainApp',
                files: files
              }]).then(resolve);

            } else {
              resolve();
            }

          })
            .then(function() {

              var dependencies = data.dependencies || [];
              var promises = [];

              dependencies.map(function(dependency) {
                var promise = $ocLazyLoad.load({
                  name: dependency.dep,
                  files: [
                    dependency.js
                  ]
                });
                promises.push(promise);
              });

              return $q.all(promises);
            });

        })
        .then(function() {
          return data;
        });
    };

    ////////////////////////////////////////////////////////////////

    $scope.urlActive = function(viewLocation) {
      return viewLocation === $location.path();
    };

    $scope.urlActiveClass = function(viewLocation) {
      if ($scope.urlActive(viewLocation)) {
        return 'active';
      } else {
        return '';
      }
    };

    $scope.get_media = agneta.get_media;
    $scope.get_avatar = agneta.get_avatar;
    $scope.get_asset = agneta.get_asset;
    $scope.get_icon = agneta.get_icon;
    $scope.get_path = agneta.langPath;


    $scope.url = agneta.url;
    $scope.lng = agneta.lng;

    $scope.loggedClass = function() {
      return $rootScope.account ? 'logged-in' : 'logged-out';
    };
  });

  app.filter('highlight', function($sce) {
    return function(text, phrase) {
      if (!text) {
        return;
      }
      if (!phrase) {
        return text;
      }
      phrase = phrase.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>{}[]\\\/]/gi, '');
      phrase = phrase.split(' ').join('|');
      text = text.replace(new RegExp('(' + phrase + ')', 'gi'),
        '<span class="highlighted">$1</span>');
      return $sce.trustAsHtml(text);
    };
  });

  app.directive('onEnter', function() {
    return function(scope, element, attrs) {
      element.bind('keydown keypress', function(event) {
        if (event.keyCode === 13) {
          scope.$apply(function() {
            scope.$eval(attrs.onEnter);
          });

          event.preventDefault();
        }
      });
    };
  });

  app.directive('dynamicCtrl', ['$controller', function($controller) {
    return {
      restrict: 'A',
      scope: true,
      link: function(scope, elem, attrs) {

        var model = elem.attr('dynamic-ctrl');

        scope.$watch(model, function(name) {
          if (name) {
            elem.data('$Controller', $controller(name, {
              $scope: scope,
              $element: elem,
              $attrs: attrs
            }));
          }
        });

      }
    };
  }]);

  app.directive('focusMe', function($timeout) {
    return {
      scope: {
        trigger: '@focusMe'
      },
      link: function(scope, element) {
        scope.$watch('trigger', function(value) {
          if (value === 'true') {
            $timeout(function() {
              element[0].focus();
            });
          }
        });
      }
    };
  });

  app.directive('compareTo', function() {
    return {
      require: 'ngModel',
      scope: {
        otherModelValue: '=compareTo'
      },
      link: function(scope, element, attributes, ngModel) {

        ngModel.$validators.compareTo = function(modelValue) {
          return modelValue == scope.otherModelValue;
        };

        scope.$watch('otherModelValue', function() {
          ngModel.$validate();
        });
      }
    };
  });

  _t_template('main/search-engine');
  _t_template('main/route');
  _t_template('main/form');
  _t_template('main/scroll');
  _t_template('main/dialog');
  _t_template('main/menu-side');

  _e_searchEngine(app);
  _e_Route(app);
  _e_Form(app);
  _e_Scroll(app);
  _e_Dialog(app);
  _e_menuSide(app);

})();
