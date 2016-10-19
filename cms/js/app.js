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

var lockOrientation = function() {
  if (window.innerWidth < BREAKPOINT && isMobile.any() && window.innerWidth / window.innerHeight > 1) {
    document.getElementsByTagName("body")[0].style.width = window.innerHeight + "px";
    document.getElementsByTagName("body")[0].style.position = "fixed";
    document.getElementsByTagName("body")[0].style.top = 0;
    document.getElementsByTagName("body")[0].style['-webkit-transform'] = "rotate(-90deg)";
    document.getElementsByTagName("body")[0].style.transform = "rotate(-90deg)";

    var containers = document.getElementsByClassName("container");
    for (var i = 0; i < containers.length; i++) {
      containers[i].style.height = window.innerWidth * .5 + "px";
    }
    document.getElementsByClassName("preview")[0].style.height = window.innerWidth * .5 + "px";
    var containers = document.getElementsByClassName("device-container");
    for (var i = 0; i < containers.length; i++) {
      containers[i].style.position = "relative";
      containers[i].style.bottom = "-50px";
    }

    document.getElementsByClassName("nav-holder")[0].style.display = "none";
    document.getElementsByClassName("instructions")[0].style.paddingTop = "20%";
  } else {
    document.getElementsByTagName("body")[0].style['-webkit-transform'] = "none";
    document.getElementsByTagName("body")[0].style.transform = "none";
    document.getElementsByTagName("body")[0].style.position = "static";
    document.getElementsByTagName("body")[0].style.width = "100%";

    if (window.innerWidth < BREAKPOINT) {
      var containers = document.getElementsByClassName("container");
      for (var i = 0; i < containers.length; i++) {
        containers[i].style.height = "40%";
      }
      document.getElementsByClassName("preview")[0].style.height = "60%";
      var containers = document.getElementsByClassName("device-container");
      for (var i = 0; i < containers.length; i++) {
        containers[i].style.position = "absolute";
        containers[i].style.bottom = "48px";
      }
    } else {
      var containers = document.getElementsByClassName("container");
      for (var i = 0; i < containers.length; i++) {
        containers[i].style.height = "auto";
      }
      document.getElementsByClassName("preview")[0].style.height = "auto";
      var containers = document.getElementsByClassName("device-container");
      for (var i = 0; i < containers.length; i++) {
        containers[i].style.position = "static";
      }
    }

    document.getElementsByClassName("nav-holder")[0].style.display = "block";
    document.getElementsByClassName("instructions")[0].style.paddingTop = 0;
  }
}

var preFocusHeight = window.innerHeight;

var resizer = function() {
  if (window.innerWidth > BREAKPOINT && window.innerHeight < 650) {
    var wrapper = document.getElementsByClassName("device-wrapper")[0];
    wrapper.style.height = window.innerHeight - 133 + "px";
  } else {
    var wrapper = document.getElementsByClassName("device-wrapper")[0];
    wrapper.style.height = "initial";
  }

  preFocusHeight = window.innerHeight;

  lockOrientation();
}

// MODULE:
var app = angular.module('Application', ['ngTouch']);


/**
 * CONTROLLER:
 **/
app.controller('ApplicationController', function($scope, $window, $sce, $timeout) {
  $scope.init = function() {
    $scope.setTheme($scope.themes[0]);
    $scope.selectedLogoOption = $scope.logoOptions[0];
    $scope.setState($scope.states[0]);
    $scope.setFormat($scope.formats[0]);
    $scope.setPreviewOption('desktop');
    $scope.setLanguage("English");

    // Advanced Customizations:
    $scope.advancedPlus = false;
    $scope.advancedCustomizationChanged = false;
    $scope.pollingLocationLabel = "Polling Locations";
    $scope.stateElectionsOfficeLabel = "State Elections Office";
    $scope.electionInformationLabel = "Election Information";
    $scope.registrationConfirmationLabel = "Registration Confirmation";
    $scope.absenteeVotingInformationLabel = "Absentee Voting Information";
    $scope.votingLocationFinderLabel = "Voting Location Finder";
    $scope.ballotInformationLabel = "Ballot Information";

    // Bug fix for theme SVGS:
    setTimeout(function() {
      $scope.setPreviewOption('tablet');
      $scope.$apply();
    }, 500);

    // Fix for android keyboard popup:
    if (window.innerWidth < BREAKPOINT) {
      var height = window.innerHeight;
      viewport = document.querySelector("meta[name=viewport]");
      viewport.setAttribute('content', 'height=' + height + ' width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');

      if (isMobile.Android()) {
        var inputs = document.getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++) {
          inputs[i].addEventListener("focus", function() {
            window.innerHeight = preFocusHeight;
          })
        }
      }
    }

    resizer();
  }

  // MOBILE STEP FUNCTIONS:
  $scope.isVisible = function(idx, step) {
    return $window.innerWidth > BREAKPOINT ? true : idx == step
  };

  $scope.isFirstVisible = function() {
    return ([1, 2, 3, 5, 9].indexOf($scope.step) != -1)
  }

  // PREVIEW FUNCTIONS:
  $scope.previewOptions = ['desktop', 'tablet', 'phone'];

  $scope.setPreviewOption = function(value) {
    $scope.selectedDevice = value;
  }

  // THEME SELECTOR:
  $scope.themeUrl = function(selectedTheme) {
    var themeUrls = {
      'No Theme': 'https://tool.votinginfoproject.org/images/theme0.png',
      'Theme One': 'https://tool.votinginfoproject.org/images/theme1.png',
      'Theme Two': 'https://tool.votinginfoproject.org/images/theme2.png',
      'Theme Three': 'https://tool.votinginfoproject.org/images/theme3.png'
    }
    return themeUrls[selectedTheme];
  }
  $scope.themes = ['No Theme', 'Theme One', 'Theme Two', 'Theme Three'];

  $scope.setTheme = function(value) {
    $scope.selectedTheme = value;
  }

  // LOGO SELECTOR:
  $scope.logoOptions = ['Default', 'State Seal', 'Custom', 'None'];
  $scope.stateSeals = {
    'Alabama': {
      pre: 'f/f7/',
      svg: 'Seal_of_Alabama.svg'
    },
    'Alaska': {
      pre: '2/2b/',
      svg: 'Alaska-StateSeal.svg'
    },
    'Arizona': {
      pre: '7/7e/',
      svg: 'Arizona-StateSeal.svg'
    },
    'Arkansas': {
      pre: 'a/a4/',
      svg: 'Seal_of_Arkansas.svg'
    },
    'California': {
      pre: '0/0f/',
      svg: 'Seal_of_California.svg'
    },
    'Colorado': {
      pre: '0/00/',
      svg: 'Seal_of_Colorado.svg'
    },
    'Connecticut': {
      pre: '4/48/',
      svg: 'Seal_of_Connecticut.svg'
    },
    'Delaware': {
      pre: '3/35/',
      svg: 'Seal_of_Delaware.svg'
    },
    'Florida': {
      pre: '2/2b/',
      svg: 'Seal_of_Florida.svg'
    },
    'Georgia': {
      pre: '7/79/',
      svg: 'Seal_of_Georgia.svg'
    },
    'Hawaii': {
      pre: 'c/ca/',
      svg: 'Seal_of_the_State_of_Hawaii.svg'
    },
    'Idaho': {
      pre: 'e/eb/',
      svg: 'Seal_of_Idaho.svg'
    },
    'Illinois': {
      pre: 'e/e7/',
      svg: 'Seal_of_Illinois.svg'
    },
    'Indiana': {
      pre: 'c/c4/',
      svg: 'Indiana-StateSeal.svg'
    },
    'Iowa': {
      pre: '5/5a/',
      svg: 'Iowa-StateSeal.svg'
    },
    'Kansas': {
      pre: '4/45/',
      svg: 'Seal_of_Kansas.svg'
    },
    'Kentucky': {
      pre: '3/35/',
      svg: 'Seal_of_Kentucky.svg'
    },
    'Louisiana': {
      pre: '2/2f/',
      svg: 'Seal_of_Louisiana.svg'
    },
    'Maine': {
      pre: '6/63/',
      svg: 'Seal_of_Maine.svg'
    },
    'Maryland': {
      pre: '1/1f/',
      svg: 'Seal_of_Maryland.svg'
    },
    'Massachusetts': {
      pre: '8/82/',
      svg: 'Seal_of_Massachusetts.svg'
    },
    'Michigan': {
      pre: '3/3f/',
      svg: 'Seal_of_Michigan.svg'
    },
    'Minnesota': {
      pre: 'a/a7/',
      svg: 'Seal_of_Minnesota.svg',
      base: "//upload.wikimedia.org/wikipedia/en/thumb/"
    },
    'Mississippi': {
      pre: '8/84/',
      svg: 'Seal_of_Mississippi_%281818-2014%29.svg'
    },
    'Missouri': {
      pre: 'd/de/',
      svg: 'Seal_of_Missouri.svg'
    },
    'Montana': {
      pre: 'e/ed/',
      svg: 'Montana-StateSeal.svg'
    },
    'Nebraska': {
      pre: '7/73/',
      svg: 'Seal_of_Nebraska.svg'
    },
    'Nevada': {
      pre: '7/77/',
      svg: 'Nevada-StateSeal.svg'
    },
    'New Hampshire': {
      pre: 'a/aa/',
      svg: 'Seal_of_New_Hampshire.svg'
    },
    'New Jersey': {
      pre: '8/8d/',
      svg: 'Seal_of_New_Jersey.svg'
    },
    'New Mexico': {
      pre: '4/47/',
      svg: 'Great_seal_of_the_state_of_New_Mexico.png',
      extension: ""
    },
    'New York': {
      pre: 'c/ca/',
      svg: 'Seal_of_New_York.svg'
    },
    'North Carolina': {
      pre: '7/72/',
      svg: 'Seal_of_North_Carolina.svg'
    },
    'North Dakota': {
      pre: 'e/e7/',
      svg: 'NorthDakota-StateSeal.svg'
    },
    'Ohio': {
      pre: '9/9b/',
      svg: 'Seal_of_Ohio_%28Official%29.svg'
    },
    'Oklahoma': {
      pre: '3/39/',
      svg: 'Seal_of_Oklahoma.svg'
    },
    'Oregon': {
      pre: '4/46/',
      svg: 'Seal_of_Oregon.svg'
    },
    'Pennsylvania': {
      pre: '7/7d/',
      svg: 'Seal_of_Pennsylvania.svg'
    },
    'Rhode Island': {
      pre: '7/76/',
      svg: 'Seal_of_Rhode_Island.svg'
    },
    'South Carolina': {
      pre: '8/80/',
      svg: 'Seal_of_South_Carolina.svg'
    },
    'South Dakota': {
      pre: 'b/bb/',
      svg: 'SouthDakota-StateSeal.svg'
    },
    'Tennessee': {
      pre: '3/3c/',
      svg: 'Seal_of_Tennessee.svg'
    },
    'Texas': {
      pre: 'c/cb/',
      svg: 'Seal_of_Texas.svg'
    },
    'Utah': {
      pre: 'a/a9/',
      svg: 'Seal_of_Utah.svg'
    },
    'Vermont': {
      pre: 'b/b3/',
      svg: 'Seal_of_Vermont_%28B%26W%29.svg'
    },
    'Virginia': {
      pre: '6/6f/',
      svg: 'Seal_of_Virginia.svg'
    },
    'Washington': {
      pre: '3/3d/',
      svg: 'Seal_of_Washington.svg'
    },
    'Washington D.C': {
      pre: '4/4e/',
      svg: 'Seal_of_Washington%2C_D.C..svg'
    },
    'West Virginia': {
      pre: '1/1c/',
      svg: 'Seal_of_West_Virginia.svg'
    },
    'Wisconsin': {
      pre: '3/31/',
      svg: 'Seal_of_Wisconsin.svg'
    },
    'Wyoming': {
      pre: 'e/e4/',
      svg: 'Seal_of_Wyoming.svg'
    }
  };
  $scope.states = Object.keys($scope.stateSeals);

  $scope.setState = function(value) {
    $scope.selectedState = value;
  }

  $scope.stateSealUrl = function(state) {
    var baseUrl = '//upload.wikimedia.org/wikipedia/commons/thumb/';

    if ($scope.selectedLogoOption == 'Default') {
      return 'img/vip-logo.png';
    } else if ($scope.selectedLogoOption == 'Custom') {
      if ($scope.logoUrl == undefined) return '//:0';
      return $scope.logoURL($scope.logoUrl);
    } else {
      console.log($scope.stateSeals[state].base)
      if ($scope.stateSeals[state].base != undefined) baseUrl = $scope.stateSeals[state].base;
      var extension = ".png"
      if ($scope.stateSeals[state].extension != undefined) extension = $scope.stateSeals[state].extension;
      if (state == "Connecticut") {
        return "//upload.wikimedia.org/wikipedia/commons/" + $scope.stateSeals[state].pre + $scope.stateSeals[state].svg;
      } else {
        return baseUrl + $scope.stateSeals[state].pre + $scope.stateSeals[state].svg + "/170px-" + $scope.stateSeals[state].svg + extension;
      }
    }
  }

  $scope.logoURL = function(url) {
    return url != void 0 && url.length > 0 ? url : '';
  }

  // COLOR SELECTOR:
  $scope.interiorTileBarColors = ['#000', '#a4a4a4', '#229acd', '#ad1b1b', '#25a095', '#9ccc66', '#ffa004', '#5e34b1', '#a1887f', '#f06292'];
  $scope.interiorSecondaryTileBarColors = ['#555', '#909090', '#228a9d', '#8d1919', '#258065', '#7caa66', '#dd8004', '#5e3481', '#81665f', '#c04273']

  // FORMAT SELECTOR:
  $scope.formats = ['640x480 - Fixed height and width', '320x240 - Fixed height and width', 'Responsive - Stretches to fill parent container'];

  $scope.setFormat = function(value) {
    $scope.selectedFormat = value;
  }

  // LANGUAGE SELECTOR:
  $scope.languages = {
    'English': 'en',
    'Spanish': 'es',
    'Amharic': 'am',
    'Chinese': 'zh',
    'Hindi': 'hi',
    'Hmong': 'hm',
    'Japanese': 'ja',
    'Karen': 'ka',
    'Khmer': 'km',
    'Korean': 'ko',
    'Laotian': 'la',
    'Oromo': 'or',
    'Russian': 'ru',
    'Somali': 'so',
    'Tagalog': 'tl-PH',
    'Thai': 'th',
    'Vietnamese': 'vi'
  };
  $scope.languageNames = Object.keys($scope.languages)

  $scope.setLanguage = function(value) {
    $scope.selectedLanguage = value;
  }

  // EMBED CODE FUNCTIONS:
  $scope.startOver = function() {
    $scope.init();
    $scope.step = 0;
    $scope.logoUrl = "";
    $scope.title = "";
    $scope.subtitle = "";
    $scope.selectedTileBarColor = $scope.interiorTileBarColors[2];
    $scope.selectedSecondaryTileBarColor = $scope.interiorSecondaryTileBarColors[2];
    $scope.alertTextEnabled = false;
    $scope.alertText = "";
    $scope.officialOnly = false;

    window.scrollTo(0, 0);
  }

  $scope.getTextToCopy = function() {
    var d = document.getElementById("embed-code");
    var textFunc = ('innerText' in d) ? 'innerText' : 'textContent';
    if ($scope.isiOS()) {
      return d.innerHTML;
    } else {
      return d[textFunc];
    }
  }

  $scope.emailCode = function() {
    $window.location = "mailto:email@address.com?&subject=VIP%20Embed%20Code&body=" + window.encodeURIComponent($scope.getTextToCopy());
  };

  // UTILS:
  $scope.isiOS = function() {
    return isMobile.iOS();
  }

  $scope.init();
});



/**
 * FILTERS:
 **/
app.filter('unsafe', function($sce) {
  return $sce.trustAsHtml;
});
app.filter('unsafeResource', function($sce) {
  return $sce.trustAsResourceUrl
});



/**
 * DIRECTIVES:
 **/
app.directive('resize', function($window) {
  return function(scope, element) {
    var w = angular.element($window);
    scope.getWindowDimensions = function() {
      return {
        'h': w.innerHeight,
        'w': w.innerWidth
      };
    };
    scope.$watch(scope.getWindowDimensions, function(newValue, oldValue) {
      scope.windowHeight = newValue.h;
      scope.windowWidth = newValue.w;

      scope.style = function() {
        return {
          'height': (newValue.h - 100) + 'px',
          'width': (newValue.w - 100) + 'px'
        };
      };

    }, true);

    w.bind('resize', function() {
      resizer();
      scope.$apply();
    });
  }
});

app.directive('dropdown', function() {
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

app.directive('navigation', function() {
  return {
    templateUrl: './partials/directives/navigation.html',
    restrict: 'E'
  }
});

app.directive('heading', function() {
  return {
    templateUrl: './partials/directives/header.html',
    restrict: 'E'
  }
});


/**
 * CONFIG:
 **/
// app.config(['ngClipProvider', function(ngClipProvider) {
//   ngClipProvider.setPath("js/vendor/ZeroClipboard.swf");
// }]);
