var app = angular.module('Application', []);
app.controller('ApplicationController', function($scope, $window, $sce) {
  $scope.isVisible = function (idx, step) {
    return $window.innerWidth > 480 ? true : idx == step
  };

  $scope.trustedLogoUrl = $sce.trustAsResourceUrl($scope.logoUrl);
  // $scope.watch('logoUrl', function(value) {
    // alert(value)
  // })
  window.scope = $scope;
});

app.directive('trustedresourceurl', function () {
  return function(scope, element, attrs) {
    console.log('woohoo')
    scope.$watch(attrs.trustedResourceUrl, function(value) {
      console.log(value);
    })
  }
})

app.directive('resize', function ($window) {
  return function (scope, element) {
    var w = angular.element($window);
    scope.getWindowDimensions = function () {
      return {
        'h': w.innerHeight,
        'w': w.innerWidth
      };
    };
    scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
      scope.windowHeight = newValue.h;
      scope.windowWidth = newValue.w;

      scope.style = function () {
        return {
          'height': (newValue.h - 100) + 'px',
          'width': (newValue.w - 100) + 'px'
        };
      };

    }, true);

    w.bind('resize', function () {
      scope.$apply();
    });
  }
});

app.directive('ngWidth', function() {
  return function(scope, element, attrs) {
    scope.$watch(attrs.ngWidth, function(value) {
      console.log(value)
      element.attr('width', value);
    });
    // console.log(attrs)
  };
});

app.directive('ngHeight', function() {
  return function(scope, element, attrs) {
    scope.$watch(attrs.ngHeight, function(value) {
      console.log(value)
      element.attr('height', value);
    });
    // console.log(attrs)
  };
});

app.directive('ngDimensions', function () {
  return function(scope, element, attrs) {
    scope.$watch(attrs.ngDimension, function(dim) {
      // console.log(dim);
    });
  }
})