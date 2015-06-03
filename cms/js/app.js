var app = angular.module('Application', ['ngClipboard', 'ngTouch']);

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

  $scope.languageNames = Object.keys($scope.languages)

  $scope.themes = ['Theme One', 'Theme Two', 'Theme Three'];

  $scope.states = [ 'Default', 'Alabama', 'Alaska', 'American Samoa', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District Of Columbia', 'Federated States Of Micronesia', 'Florida', 'Georgia', 'Guam', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Marshall Islands', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Northern Mariana Islands', 'Ohio', 'Oklahoma', 'Oregon', 'Palau', 'Pennsylvania', 'Puerto Rico', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virgin Islands', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming' ];

  $scope.setFormat = function (value) {
    $scope.selectedFormat = value;
  }

  $scope.setLanguage = function (value) {
    $scope.selectedLanguage = value;
  }

  $scope.setTheme = function (value) {
    $scope.selectedTheme = value;
  }

  $scope.setState = function (value) {
    $scope.selectedState = value;
  }

  $scope.setPreviewOption = function (value) {
    $scope.selectedDevice = value;
  }

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

app.directive('dropdown', function () {
  return {
    templateUrl: '../partials/directives/dropdown.html',
    restrict: 'E',
    scope: {
      defaultText: '@',
      options: '=',
      setValue: '&',
      myClass: '@'
    }
  }
});

app.directive('navigation', function () {
  return {
    templateUrl: '../partials/directives/navigation.html',
    restrict: 'E'
  }
});

app.directive('heading', function () {
  return {
    templateUrl: '../partials/directives/header.html',
    restrict: 'E'
  }
});

app.config(['ngClipProvider', function(ngClipProvider) {
  ngClipProvider.setPath("js/vendor/ZeroClipboard.swf");
}]);