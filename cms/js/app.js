var app = angular.module('Application', ['ngClipboard']);

app.controller('ApplicationController', function($scope, $window, $sce) {
  $scope.isVisible = function (idx, step) {
    return $window.innerWidth > 480 ? true : idx == step
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
    $scope.alertText = "";
    $scope.selectedLanguage = $scope.languageOptions[0];
    $scope.selectedLogoOption = $scope.logoOptions[0]
    $scope.logoUrl = undefined;
    $scope.selectedState = "Default";
    window.scrollTo(0,0);
  }

  $scope.getTextToCopy = function () {
    var d = document.getElementById("embed-code");
    var text = ('innerText' in d)? 'innerText' : 'textContent';
    return d[text];
  }

  $scope.emailCode = function () {
    $window.location = "mailto:email@address.com?&subject=Your%20Embed%20Code&body=" + window.encodeURI($scope.getTextToCopy());
  };

  $scope.isFirstVisible = function () {
    return ([2, 3, 5, 8].indexOf($scope.step) != -1)
  }
});

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

app.config(['ngClipProvider', function(ngClipProvider) {
  ngClipProvider.setPath("js/vendor/ZeroClipboard.swf");
}]);