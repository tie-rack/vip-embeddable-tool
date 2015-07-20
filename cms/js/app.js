// RESIZER:
var BREAKPOINT = 685;
var isMobile = {
  Android: function() {
    return navigator.userAgent.match(/Android/i) ? true : false;
  },
  BlackBerry: function() {
    return navigator.userAgent.match(/BlackBerry/i) ? true : false;
  },
  iOS: function() {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
  },
  iPad: function() {
    return navigator.userAgent.match(/iPad/i) ? true : false;
  },
  Windows: function() {
    return navigator.userAgent.match(/IEMobile/i) ? true : false;
  },
  any: function() {
    return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
  }
};

var lockOrientation = function () {
  if (window.innerWidth < 685 && isMobile.any() && window.innerWidth/window.innerHeight > 1) {
    document.getElementsByTagName("body")[0].style.width = window.innerHeight + "px";
    document.getElementsByTagName("body")[0].style.position = "absolute";
    document.getElementsByTagName("body")[0].style.top = 0;
    document.getElementsByTagName("body")[0].style['-webkit-transform'] = "rotate(-90deg)";
    document.getElementsByTagName("body")[0].style.transform = "rotate(-90deg)";

    document.getElementsByClassName("nav-holder")[0].style.display = "none";
    document.getElementsByClassName("instructions")[0].style.paddingTop = "20%";
  } else {
    document.getElementsByTagName("body")[0].style.width = "100%";
    document.getElementsByTagName("body")[0].style.position = "static";
    document.getElementsByTagName("body")[0].style['-webkit-transform'] = "none";
    document.getElementsByTagName("body")[0].style.transform = "none";

    document.getElementsByClassName("nav-holder")[0].style.display = "block";
    document.getElementsByClassName("instructions")[0].style.paddingTop = 0;
  }
}

var resizer = function () {
  if (window.innerWidth > BREAKPOINT && window.innerHeight < 650) {
    var wrapper = document.getElementsByClassName("device-wrapper")[0];
    wrapper.style.height = window.innerHeight - 133 + "px";
  } else {
    var wrapper = document.getElementsByClassName("device-wrapper")[0];
    wrapper.style.height = "initial";
  }

  lockOrientation();
}

// MODULE:
var app = angular.module('Application', ['ngClipboard', 'ngTouch']);


/**
* CONTROLLER:
**/
app.controller('ApplicationController', function($scope, $window, $sce, $timeout) {
  $scope.init = function () {
    $scope.setTheme($scope.themes[0]);
    $scope.selectedLogoOption = $scope.logoOptions[0];
    $scope.setState($scope.states[0]);
    $scope.setFormat($scope.formats[0]);
    $scope.setPreviewOption('desktop');
    $scope.setLanguage("English");

    // Bug fix for theme SVGS:
    setTimeout(function () {
      $scope.setPreviewOption('tablet');
      $scope.$apply();
    }, 500);

    // Fix for android keyboard popup:
    if (window.innerWidth < BREAKPOINT) {
      var height = window.innerHeight;
      viewport = document.querySelector("meta[name=viewport]");
      viewport.setAttribute('content', 'height=' + height + ' width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
    }

    resizer();
  }

  // MOBILE STEP FUNCTIONS:
  $scope.isVisible = function (idx, step) {
    return $window.innerWidth > BREAKPOINT ? true : idx == step
  };

  $scope.isFirstVisible = function () {
    return ([1, 2, 3, 5, 8].indexOf($scope.step) != -1)
  }

  // PREVIEW FUNCTIONS:
  $scope.previewOptions = ['desktop', 'tablet', 'phone'];

  $scope.setPreviewOption = function (value) {
    $scope.selectedDevice = value;
  }

  // THEME SELECTOR:
  $scope.themeUrl = function(selectedTheme) {
    var themeUrls = {'No Theme': 'https://s3.amazonaws.com/vip-voter-information-tool/images/theme0.png', 'Theme One': 'https://s3.amazonaws.com/vip-voter-information-tool/images/theme1.png', 'Theme Two': 'https://s3.amazonaws.com/vip-voter-information-tool/images/theme2.png', 'Theme Three': 'https://s3.amazonaws.com/vip-voter-information-tool/images/theme3.png'}
    return themeUrls[selectedTheme];
  }
  $scope.themes = ['No Theme', 'Theme One', 'Theme Two', 'Theme Three'];

  $scope.setTheme = function (value) {
    $scope.selectedTheme = value;
  }

  // LOGO SELECTOR:
  $scope.logoOptions = ['Default', 'State Seal', 'Custom', 'None'];
  $scope.stateSeals = {'Alabama': 'f/f7/Seal_of_Alabama.svg','Alaska': '2/2b/Alaska-StateSeal.svg','Arizona': '7/7e/Arizona-StateSeal.svg','Arkansas': 'a/a4/Seal_of_Arkansas.svg','California': '0/0f/Seal_of_California.svg','Colorado': '0/00/Seal_of_Colorado.svg','Connecticut': '4/48/Seal_of_Connecticut.svg','Delaware': '3/35/Seal_of_Delaware.svg','Florida': '2/2b/Seal_of_Florida.svg','Georgia': '7/79/Seal_of_Georgia.svg','Hawaii': 'c/ca/Seal_of_the_State_of_Hawaii.svg','Idaho': 'e/eb/Seal_of_Idaho.svg','Illinois': 'e/e7/Seal_of_Illinois.svg','Indiana': 'c/c4/Indiana-StateSeal.svg','Iowa': '5/5a/Iowa-StateSeal.svg','Kansas': '4/45/Seal_of_Kansas.svg','Kentucky': '3/35/Seal_of_Kentucky.svg','Louisiana': 'b/b4/Seal_of_Louisiana_2010.png','Maine': '6/63/Seal_of_Maine.svg','Maryland': '1/1f/Seal_of_Maryland_%28obverse%29.png','Massachusetts': '8/82/Seal_of_Massachusetts.svg','Michigan': '3/3f/Seal_of_Michigan.svg','Minnesota': 'f/fd/Seal_of_Minnesota-alt.png','Mississippi': '8/84/Seal_of_Mississippi_%281818-2014%29.svg','Missouri': 'd/de/Seal_of_Missouri.svg','Montana': 'e/ed/Montana-StateSeal.svg','Nebraska': '7/73/Seal_of_Nebraska.svg','Nevada': '7/77/Nevada-StateSeal.svg','New Hampshire': 'a/aa/Seal_of_New_Hampshire.svg','New Jersey': '8/8d/Seal_of_New_Jersey.svg','New Mexico': '4/47/Great_seal_of_the_state_of_New_Mexico.png','New York': 'c/ca/Seal_of_New_York.svg','North Carolina': '7/72/Seal_of_North_Carolina.svg','North Dakota': 'e/e7/NorthDakota-StateSeal.svg','Ohio': '9/9b/Seal_of_Ohio_%28Official%29.svg','Oklahoma': '3/39/Seal_of_Oklahoma.svg','Oregon': '4/46/Seal_of_Oregon.svg','Pennsylvania': '7/7d/Seal_of_Pennsylvania.svg','Rhode Island': '7/76/Seal_of_Rhode_Island.svg','South Carolina': '8/80/Seal_of_South_Carolina.svg','South Dakota': 'b/bb/SouthDakota-StateSeal.svg','Tennessee': '3/3c/Seal_of_Tennessee.svg','Texas': 'c/cb/Seal_of_Texas.svg','Utah': 'a/a9/Seal_of_Utah.svg','Vermont': 'b/b3/Seal_of_Vermont_%28B%26W%29.svg','Virginia': '6/6f/Seal_of_Virginia.svg','Washington': '3/3d/Seal_of_Washington.svg','West Virginia': '1/1c/Seal_of_West_Virginia.svg','Wisconsin': '3/31/Seal_of_Wisconsin.svg','Wyoming': 'e/e4/Seal_of_Wyoming.svg'};
  $scope.states = Object.keys($scope.stateSeals);

  $scope.setState = function (value) {
    $scope.selectedState = value;
  }

  $scope.stateSealUrl = function (state) {
    var baseUrl = '//upload.wikimedia.org/wikipedia/commons/';

    if ($scope.selectedLogoOption == 'Default') {
      return 'img/vip-logo.png';
    } else {
      return baseUrl + $scope.stateSeals[state];
    }
  }

  $scope.logoURL = function (url) {
    return url != void 0 && url.length > 0 ? url : '';
  }

  // COLOR SELECTOR:
  $scope.interiorTileBarColors = ['#000', '#a4a4a4', '#229acd', '#ad1b1b', '#25a095', '#9ccc66', '#ffa004', '#5e34b1', '#a1887f', '#f06292'];
  $scope.interiorSecondaryTileBarColors = ['#555', '#909090', '#228a9d', '#8d1919', '#258065', '#7caa66', '#dd8004', '#5e3481', '#81665f', '#c04273']

  // FORMAT SELECTOR:
  $scope.formats = ['640x480', '320x240', 'Responsive'];

  $scope.setFormat = function (value) {
    $scope.selectedFormat = value;
  }

  // LANGUAGE SELECTOR:
  $scope.languages = {'English': 'en','Spanish': 'es','Hindi': 'hi','Japanese': 'ja','Khmer': 'km','Korean': 'ko','Tagalog': 'tl-PH','Thai': 'th','Vietnamese': 'vi','Chinese': 'zh'};
  $scope.languageNames = Object.keys($scope.languages)

  $scope.setLanguage = function (value) {
    $scope.selectedLanguage = value;
  }

  // EMBED CODE FUNCTIONS:
  $scope.startOver = function () {
    $scope.init();
    $scope.step = 0;
    $scope.logoUrl = "";
    $scope.title = "";
    $scope.subtitle = "";
    $scope.selectedTileBarColor = $scope.interiorTileBarColors[2];
    $scope.selectedSecondaryTileBarColor = $scope.interiorSecondaryTileBarColors[2];
    $scope.alertTextEnabled = false;
    $scope.alertText = "";

    window.scrollTo(0,0);
  }

  $scope.getTextToCopy = function () {
    var d = document.getElementById("embed-code");
    var textFunc = ('innerText' in d) ? 'innerText' : 'textContent';
    if ($scope.isiOS()) {
      return d.innerHTML;
    } else {
      return d[textFunc];
    }
  }

  $scope.emailCode = function () {
    $window.location = "mailto:email@address.com?&subject=VIP%20Embed%20Code&body=" + window.encodeURIComponent($scope.getTextToCopy());
  };

  // UTILS:
  $scope.isiOS = function () {
    return isMobile.iOS();
  }

  $scope.flashButtonClickWorkaround = function () {
    document.getElementById("copy-code-button").style.top = "2px";
    document.getElementById("copy-code-button").style.left = "2px";
    setTimeout(function () {
      document.getElementById("copy-code-button").style.top = 0;
      document.getElementById("copy-code-button").style.left = 0;
    }, 300)
  }

  $scope.init();
});



/**
* FILTERS:
**/
app.filter('unsafe', function($sce) { return $sce.trustAsHtml; });
app.filter('unsafeResource', function($sce) { return $sce.trustAsResourceUrl });



/**
* DIRECTIVES:
**/
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
      resizer();
      scope.$apply();
    });
  }
});

app.directive('dropdown', function () {
  return {
    templateUrl: './partials/directives/dropdown.html',
    restrict: 'E',
    scope: {
      defaultText: '@',
      selectedValue: '=',
      options: '=',
      setValue: '&',
      myClass: '@'
    }
  }
});

app.directive('navigation', function () {
  return {
    templateUrl: './partials/directives/navigation.html',
    restrict: 'E'
  }
});

app.directive('heading', function () {
  return {
    templateUrl: './partials/directives/header.html',
    restrict: 'E'
  }
});


/**
* CONFIG:
**/
app.config(['ngClipProvider', function(ngClipProvider) {
  ngClipProvider.setPath("js/vendor/ZeroClipboard.swf");
}]);