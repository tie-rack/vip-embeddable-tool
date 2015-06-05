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

  $scope.states = [
    'Default',
    'Alabama',
    'Alaska',
    // 'American Samoa',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    // 'District Of Columbia',
    // 'Federated States Of Micronesia',
    'Florida',
    'Georgia',
    // 'Guam',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    // 'Marshall Islands',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    // 'Northern Mariana Islands',
    'Ohio',
    'Oklahoma',
    'Oregon',
    // 'Palau',
    'Pennsylvania',
    // 'Puerto Rico',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    // 'Virgin Islands',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming'
  ];

  $scope.stateSealUrl = function (state) {
    var defaultUrl = 'img/vip-logo.png';

    var baseUrl = '//upload.wikimedia.org/wikipedia/commons/';
    var stateSeals = {
      'Alabama': 'f/f7/Seal_of_Alabama.svg',
      'Alaska': '2/2b/Alaska-StateSeal.svg',
      'American Samoa': '',
      'Arizona': '7/7e/Arizona-StateSeal.svg',
      'Arkansas': 'a/a4/Seal_of_Arkansas.svg',
      'California': '0/0f/Seal_of_California.svg',
      'Colorado': '0/00/Seal_of_Colorado.svg',
      'Connecticut': '4/48/Seal_of_Connecticut.svg',
      'Delaware': '3/35/Seal_of_Delaware.svg',
      'District Of Columbia': '',
      'Federated States Of Micronesia': '',
      'Florida': '2/2b/Seal_of_Florida.svg',
      'Georgia': '7/79/Seal_of_Georgia.svg',
      'Guam': '',
      'Hawaii': 'c/ca/Seal_of_the_State_of_Hawaii.svg',
      'Idaho': 'e/eb/Seal_of_Idaho.svg',
      'Illinois': 'e/e7/Seal_of_Illinois.svg',
      'Indiana': 'c/c4/Indiana-StateSeal.svg',
      'Iowa': '5/5a/Iowa-StateSeal.svg',
      'Kansas': '4/45/Seal_of_Kansas.svg',
      'Kentucky': '3/35/Seal_of_Kentucky.svg',
      'Louisiana': 'b/b4/Seal_of_Louisiana_2010.png',
      'Maine': '6/63/Seal_of_Maine.svg',
      'Marshall Islands': '',
      'Maryland': '1/1f/Seal_of_Maryland_%28obverse%29.png',
      'Massachusetts': '8/82/Seal_of_Massachusetts.svg',
      'Michigan': '3/3f/Seal_of_Michigan.svg',
      'Minnesota': 'f/fd/Seal_of_Minnesota-alt.png',
      'Mississippi': '8/84/Seal_of_Mississippi_%281818-2014%29.svg',
      'Missouri': 'd/de/Seal_of_Missouri.svg',
      'Montana': 'e/ed/Montana-StateSeal.svg',
      'Nebraska': '7/73/Seal_of_Nebraska.svg',
      'Nevada': '7/77/Nevada-StateSeal.svg',
      'New Hampshire': 'a/aa/Seal_of_New_Hampshire.svg',
      'New Jersey': '8/8d/Seal_of_New_Jersey.svg',
      'New Mexico': '4/47/Great_seal_of_the_state_of_New_Mexico.png',
      'New York': 'c/ca/Seal_of_New_York.svg',
      'North Carolina': '7/72/Seal_of_North_Carolina.svg',
      'North Dakota': 'e/e7/NorthDakota-StateSeal.svg',
      'Northern Mariana Islands': '',
      'Ohio': '9/9b/Seal_of_Ohio_%28Official%29.svg',
      'Oklahoma': '3/39/Seal_of_Oklahoma.svg',
      'Oregon': '4/46/Seal_of_Oregon.svg',
      'Palau': '',
      'Pennsylvania': '7/7d/Seal_of_Pennsylvania.svg',
      'Puerto Rico': '',
      'Rhode Island': '7/76/Seal_of_Rhode_Island.svg',
      'South Carolina': '8/80/Seal_of_South_Carolina.svg',
      'South Dakota': 'b/bb/SouthDakota-StateSeal.svg',
      'Tennessee': '3/3c/Seal_of_Tennessee.svg',
      'Texas': 'c/cb/Seal_of_Texas.svg',
      'Utah': 'a/a9/Seal_of_Utah.svg',
      'Vermont': 'b/b3/Seal_of_Vermont_%28B%26W%29.svg',
      'Virgin Islands': '',
      'Virginia': '6/6f/Seal_of_Virginia.svg',
      'Washington': '3/3d/Seal_of_Washington.svg',
      'West Virginia': '1/1c/Seal_of_West_Virginia.svg',
      'Wisconsin': '3/31/Seal_of_Wisconsin.svg',
      'Wyoming': 'e/e4/Seal_of_Wyoming.svg'
    };

    var seal = stateSeals[state];

    return seal != void 0 && seal.length > 0 ? baseUrl + stateSeals[state] : defaultUrl;
  }



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

app.filter('unsafe', function($sce) { return $sce.trustAsHtml; });

app.filter('unsafeResource', function($sce) { return $sce.trustAsResourceUrl });

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