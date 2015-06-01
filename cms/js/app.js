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

  $scope.log = function (el) {
    console.log(el)
  };

  $scope.languages = {
    'English': 'en',
    'Spanish': 'es',
    'Hindi': 'hi',
    'Japanese': 'ja',
    'Khmer': 'km',
    'Korean': 'ko',
    'Tagalog': 'tl-PH',
    'Thai': 'th',
    'Vietnamese': 'vi',
    'Chinese': 'zh'
  };

  $scope.startOver = function () {
    $scope.step = 0;
    $scope.selectedTheme = "Theme One";
    $scope.selectedLogoOption = $scope.logoOptions[0];
    $scope.title = "";
    $scope.subtitle = "";
    $scope.selectedTileBarColor = $scope.interiorTileBarColors[2];
    $scope.selectedSecondaryTileBarColor = $scope.interiorSecondaryTileBarColors[2];
    $scope.alertTextEnabled = false;
    $scope.selectedLanguage = $scope.languageOptions[0];
    window.scrollTo(0,0);
  }
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