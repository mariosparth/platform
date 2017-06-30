(function() {

    var scrollParent;

    app.run(function($rootScope, $mdUtil, $timeout) {

        $rootScope.scrollTop = function() {
            $mdUtil.animateScrollTo(scrollParent, 0, 500);
        };
        $rootScope.scrollTo = function(eID) {
            $timeout(function() {
                var position = elmYPosition(eID);
                //console.log(position);
                $mdUtil.animateScrollTo(scrollParent, position, 500);
            }, 100);
        };

    });

    app.directive('docsScrollClass', function() {
        return {
            restrict: 'A',
            link: function($scope, element, attr) {

                scrollParent = element.parent().parent()[0];
                var isScrolling = false;

                // Initial update of the state.
                updateState();

                scrollParent.addEventListener("scroll", updateState);

                function updateState() {

                    var newState = scrollParent.scrollTop > 400;
                    if (newState !== isScrolling) {
                        element.toggleClass(attr.docsScrollClass, newState);
                    }

                    isScrolling = newState;
                }
            }
        };
    });

    app.directive('autoScroll', function($document, $timeout,$window, $location) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {

                var elm = element[0];
                scope.okSaveScroll = true;
                scope.scrollPos = {};

                element.bind('scroll', function() {
                    if (scope.okSaveScroll) {
                        scope.scrollPos[$location.path()] = elm.scrollTop;
                    }
                });

                scope.scrollClear = function(path) {
                    scope.scrollPos[path] = 0;
                };

                scope.$on('$viewContentLoaded', function(route) {
                    $timeout(function() {
                        elm.scrollTop = scope.scrollPos[$location.path()] ? scope.scrollPos[$location.path()] : 0;
                        scope.okSaveScroll = true;
                    }, 0);
                });

                scope.$on('$locationChangeStart', function(event) {
                    scope.okSaveScroll = false;
                });
            }
        };
    });

    function elmYPosition(eID) {
        var elm = document.getElementById(eID);
        return elm.offsetTop;
    }
})();
