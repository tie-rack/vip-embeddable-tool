var View = require('./view.js');
var api = require('../api.js');
var $ = require('jquery');
var fastclick = require('fastclick');
var ouiCal = require('../ouical.js');
var _ = require('lodash');
var async = require('async');
var LocationMatcher = require('../locationMatcher');
var zipcodes = require('../cv');
var BinarySearchIndex = require('tiny-binary-search');

module.exports = View.extend({

  $id: 'map-view',

  template: require('./templates/map.hbs'),

  addressPartial: require('./templates/partials/address.hbs'),

  locationPartial: require('./templates/partials/location.hbs'),

  landscape: false,

  hasSubmitted: false,

  initialParent: undefined,

  modal: false,

  events: {
    '#map-view click': "closePopUps",
    '.nav click': 'back',
    '.contest-toggle click': 'toggleContest',
    '.election-selection click': 'changeElection',
    '#registered-address click': 'changeAddress',
    '#vote-address-edit click': 'changeAddress',
    '.address click': 'changeAddress',
    '#fade click': 'changeAddress',
    '.change-address keypress': 'showPlaceAutocomplete',
    '#submit-address-button click': 'submitAddress',
    '#polling-location click': 'toggleMap',
    '#more-elections click': 'toggleElections',
    '#resources-toggle click': 'toggleResources',
    '#plus-icon click': 'openAboutModal',
    '#close-button click': 'closeAboutModal',
    '#ballot-information click': 'toggleBallot',
    '#map-view-toggle click': 'toggleMapListView',
    '#alert click': 'closeAlert',
    '#not-found-button click': 'closeAddressNotFound',
    '#error-feedback-link click': 'submitErrorForm',
    '#location-legend-close click': 'closeLocationLegend',
    '#polling-location-info-close click': 'closePollingLocationInfo',
    '#blue-block click': 'panToFirstPollingLocation',
    '#red-block click': 'panToFirstEarlyVoteSite',
    '#grey-block click': 'panToFirstDropoffLocation',
    '#green-block click': 'panToFirstMultiSite'
  },

  map: null,

  markers: [],

  address: '',

  locationTypes: {},

  mapIsDisplayed: true,

  _stringReplacePattern: /\./g,

  _geocoder: void 0,

  _GEOCODE_RETRY_TIMEOUT: 100,

  _DATE_DISPLAY_OPTIONS: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  },

  _MAP_STYLES: [{
      featureType: "road",
      elementType: "labels",
      stylers: [{
        lightness: 20
      }]
    }, {
      featureType: "administrative.land_parcel",
      elementType: "all",
      stylers: [{
        visibility: "off"
      }]
    }, {
      featureType: "landscape.man_made",
      elementType: "all",
      stylers: [{
        visibility: "off"
      }]
    }, {
      featureType: "transit",
      elementType: "all",
      stylers: [{
        visibility: "off"
      }]
    }, {
      featureType: "road.highway",
      elementType: "labels",
      stylers: [{
        visibility: "off"
      }]
    }, {
      featureType: "road.arterial",
      elementType: "labels",
      stylers: [{
        visibility: "off"
      }]
    }, {
      featureType: "water",
      elementType: "all",
      stylers: [{
        hue: "#a1cdfc"
      }, {
        saturation: 39
      }, {
        lightness: 49
      }]
    }, {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{
        hue: "#f49935"
      }]
    }, {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{
        hue: "#fad959"
      }]
    }],

  removeNameDupes: function(location) {
    if (_.get(location, 'name') == _.get(location, 'address.locationName')) {
      location.name = void 0;
    }
  },

  onBeforeRender: function(options) {
    // $("#_vit").css("max-width", "800px")
    // $("#_vit .footer").css("max-width", "800px")
    this.closed = false;

    // TODO: REFACTOR THIS INTO OWN FUNCTION
    // sets special viewport tag
    if (navigator.userAgent.match('CriOS')) {
      $('<meta>')
        .attr('name', 'viewport')
        .attr('content', 'width=device-width,initial-scale=0.75')
        .attr('id', 'viewport-mobile-web-tag')
        .appendTo($('head'));
    }

    // TODO: detect webkit/iOS here...
    // set iOS flow scrolling
    $(this.$container).css('-webkit-overflow-scrolling', 'touch');

    options.data.locations = LocationMatcher(options.data);

    _.each(options.data.locations, this.removeNameDupes);

    options.data.home = { address: options.data.normalizedInput };

    this._geocoder = new google.maps.Geocoder();

    // set default names for the election bodies and remove duplicate addresses
    var state = _.get(options, 'data.state[0]');
    if (_.has(state, 'electionAdministrationBody')) {
      _.defaultsDeep(state, _.set({}, 'electionAdministrationBody.name', "Election Administration Body"));

      var correspondenceAddress = _.get(state, 'electionAdministrationBody.correspondenceAddress');
      var physicalAddress = _.get(state, 'electionAdministrationBody.physicalAddress');

      if (correspondenceAddress == physicalAddress) {
        _.unset(state, 'electionAdministrationBody.correspondenceAddress');
      }
    }

    if (_.has(state, 'local_jurisdiction')) {
      _.defaultsDeep(state, _.set({}, 'local_jurisdiction.name', "Local Jurisdiction"));
    }

    // reformat the dates: Civic Info API returns yyyy-mm-dd, so split
    // them and give them to the date object--decrementing month, because
    // it's 0-indexed. Then convert it to a locale string
    var dateArray = _.get(options, 'data.election.electionDay').split('-');
    var date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);

    _.set(options, 'data.election.dateForCalendar', date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear());

    var newDate = date.toLocaleDateString(options.language, this._DATE_DISPLAY_OPTIONS);

    _.set(options, 'data.election.electionDay', newDate);

    var contests = _.get(options, 'data.contests');
    _.set(options, 'data.contests', _.sortBy(contests, this._contestComparator))


    // get all closed primaries
    var closedPrimaries = _.filter(contests, function(c) { return _.get(c, 'primaryParty') });
    var openPrimaries = _.filter(contests, function(c) { return !_.get(c, 'primaryParty') });

    // get list of each primary party
    var primaryParties = _.uniq(_.map(closedPrimaries, function(primary) { return _.get(primary, 'primaryParty') }));
    _.forEach(primaryParties, function(party) {
      if (!_.has(data, 'closedPrimaries')) {
        _.set(data, 'closedPrimaries', {});
      }
      options.data.closedPrimaries[party] = _.union(_.filter(closedPrimaries, function(primary) {
        return primary.primaryParty == party;
      }), openPrimaries);
    });

    this.data = options.data;
    this.assets = options.assets;
    // console.log(this.data)
    // TODO: REFACTOR THIS INTO OWN FUNCTION
    // places the modal and the tool as the first element on the page
    // to deal with certain z-index / positioning issues
    $('<div id="_vitModal">')
      .prependTo($('html'));

    if (options.modal) {
      this.modal = true;
      this.$container.addClass('vit-modal');
      this.initialParent = $("#_vit").parent();
      $("#_vit").prependTo($('html'));
    }

    this._parseZipCodes();
  },

  _resizeHandler: function() {
    //console.log("#_resizeHandler");
    if (!this.modal) {
      this.landscape = this.$container.width() > 500;
      return;
    }

    var width = $(window).width(),
      height = $(window).height(),
      screenWidth = screen.availWidth,
      screenHeight = screen.availHeight;

    if (!$('#viewport-mobile-web-tag').length) {
      $('<meta>')
        .attr('name', 'viewport')
        .attr('content', 'initial-scale=1.0, maximum-scale=1.0')
        .attr('id', 'viewport-mobile-web-tag')
        .appendTo($('head'));
    }

    $(window).scrollTop(0).scrollLeft(0);

    if (screenWidth < 600) {
      this.$container.width(window.innerWidth);
      this.$container.height(window.innerHeight);

      this.find('#map-canvas').width(window.innerWidth);

      this.$container.addClass('_vit_floating-container');
      $('html, body').removeClass('_vit_max-height');
      $('body').addClass('_vit_no-scroll');

      this.landscape = false;
    } else {
      // tablet sizing
      this.$container
        .width(width - 40);

      var containerWidth = this.$container.width();
      this.$container
        .height(containerWidth * (7 / 10));

      var containerHeight = this.$container.height();
      var top = (height / 2) - (containerHeight / 2);
      top = (top > 0 ? top : 0);

      this.$container
        .css({
          'top': top + 'px',
          'left': ((width / 2) - (containerWidth / 2)) + 'px'
        });

      this.$container.addClass('_vit_floating-modal-container');
      $('html, body').addClass('_vit_max-height');
      $('body').removeClass('_vit_no-scroll')

      this.landscape = true;
    }
  },

  submitErrorForm: function(event) {
    event.preventDefault();

    this.find('#error-feedback-form').submit();
  },

  _initializeMap: function (primaryLocation) {
    this._encodeAddressAndInitializeMap(primaryLocation);

    this._sortLocations(primaryLocation);

    var $location = $(this.locationPartial({
      assets: this.assets,
      location: primaryLocation,
      daddr: this._parseAddressWithoutName(_.get(primaryLocation, 'address')),
      saddr: this._parseAddressWithoutName(_.get(this.data, 'home.address'))
    }));

    $location.find('#polling-location-info-close').on('click', this.closePollingLocationInfo.bind(this));

    $location.insertBefore(this.find('#map-canvas'));

    if (!_.isUndefined(primaryLocation)) {
      this._setZoom();
      this._geocodeSequence(this.data.locations, this.data.normalizedInput);
    }
  },

  onAfterRender: function(options) {

    this.width = options.width;
    this.height = options.height;

    this.prevWidth = this.$container.width();
    this.prevHeight = this.$container.height();
    this.prevLeft = this.$container.css('left');
    this.prevTop = this.$container.css('top');

    $(window).on('resize.mapview', this._resizeHandler.bind(this));

    this._resizeHandler();

    setTimeout(this._resizeHandler.bind(this), 250);

    this._getClosestLocation(this._initializeMap.bind(this));

    if (this.landscape) {
      this._switchToLandscape(options);
      this.toggleMap();
    }

    $('html,body').scrollLeft($(this.$container).scrollLeft());
    $('html,body').scrollTop($(this.$container).scrollTop());

    if (_.get(this.data, 'pollingLocations[0].pollingHours')) {
      var times = this.parseTime(options.data.pollingLocations[0].pollingHours);
      if (!!times) {
        var startDate = new Date(options.data.election.dateForCalendar);
        startDate.setHours(times[0]);

        var endDate = new Date(options.data.election.dateForCalendar);
        endDate.setHours(times[1]);

        var myCalendar = createOUICalendar({
          options: {
            notClass: 'add-to-calendar-drop-class',
            id: 'add-to-calendar-dropdown'
          },
          data: {
            title: options.data.election.name,
            start: startDate,
            end: endDate,
            duration: 1440,
            address: this._parseAddress(_.get(this.data, 'locations[0].address')),
            description: options.data.election.name
          }
        });

        document.querySelector('#calendar-icon').appendChild(myCalendar);
      }
    }


    fastclick(document.body);

    // if (!this.landscape) this._preventiOSBounce();

    this.autocomplete = new google.maps.places.Autocomplete(this.find('.change-address')[0], {
      types: ['address'],
      componentRestrictions: {
        country: 'us'
      }
    });

    window.setTimeout(this.closeAlert.bind(this), 8000);

    if (options.data.closedPrimaries) {
      var $closedPrimariesSelection = this.find('.closed-primaries-selection');
      var $selectClosedPrimary = $closedPrimariesSelection.find('.select-closed-primary');
      var $closedPrimaries = this.find('.closed-primaries');

      $selectClosedPrimary.on('click', function() {
        // get selected primary name
        var primaryName = $(this).data('primary-name');

        // hide selection view
        $closedPrimariesSelection.addClass('hidden');

        // show closed primaries view
        $closedPrimaries.removeClass('hidden');

        // get chosen closed primary
        var $chosenPrimary = $closedPrimaries.find('.closed-primary').filter('[data-primary-name="' + primaryName + '"]');

        // display chosen closed primary
        $chosenPrimary.removeClass('hidden');

        // allow the user to go back
        $closedPrimaries.find('.closed-primary-back button').one('click', function() {
          $chosenPrimary.addClass('hidden');
          $closedPrimaries.addClass('hidden');
          $closedPrimariesSelection.removeClass('hidden')
        });

      });
    }

    this.toggleAllContests();
  },

  closePopUps: function(e) {
    if (!$(e.target).is($(".add-to-calendar-checkbox")))
      this.find(".add-to-calendar-checkbox").attr("checked", false)
  },

  onRemove: function() {
    if (this.autocomplete) google.maps.event.clearInstanceListeners(this.autocomplete);

    this.markers = [];

    this.$container.css({
      'width': '',
      'height': '',
      'left': '',
      'top': ''
    });

    this.$container.off();

    $('#_vitModal').remove();

    if (this.modal) {
      $("#_vit").prependTo($(this.initialParent));
    }

    $('#viewport-mobile-web-tag').remove();

    $(window).off('.mapview');
  },

  _modifyExternals: function() {
    $('html, body')
      .addClass('_vit_max-height')
      .find('#_vitModal')
      .show()
      .one('click', function() {
        $(this).hide();
        this.back();
      }.bind(this))
      .end()
  },

  _preventiOSBounce: function() {
    var allowUp, allowDown, slideBeginY, slideBeginX;
    this.$container.on('touchstart', function(event) {
      if ($(event.target) == this.find('#map-canvas')) {
        return;
      }
      allowUp = (this.scrollTop > 0);
      allowDown = (this.scrollTop < this.scrollHeight - this.clientHeight);
      slideBeginY = event.originalEvent.pageY;
      slideBeginX = event.originalEvent.pageX
    }.bind(this));

    this.$container.on('touchmove', function(event) {
      if ($(event.target) == this.find('#map-canvas')) {
        return;
      }
      var up = (event.originalEvent.pageY > slideBeginY);
      var down = (event.originalEvent.pageY < slideBeginY);
      var horizontal = (event.originalEvent.pageX !== slideBeginX);
      $(window).scrollLeft(0);
      slideBeginY = event.originalEvent.pageY;
      if (((up && allowUp) || (down && allowDown))) {} else {
        event.preventDefault();
      }
    }.bind(this));
  },

  _switchToLandscape: function(options) {
    if (this.modal) this._modifyExternals();
    this.$container.addClass('landscape');
    this.$el
      .addClass('landscape')
      .prepend(
        this.find('.left')
        .detach()
        .wrapAll('<div class="left-overflow-wrapper"><div class="left-wrapper" />')
        .parent()
        .prepend($('<div class="left box" id="vip-logo">')
          .css('background-image', 'url(' + options.smallLogo + ')')
        )
      )
    this.find('.right').wrapAll('<div class="right-wrapper" />');

    this.find('#resources-toggle .toggle-image').toggleClass('hidden');
    this.find('#ballot-information .toggle-image').toggleClass('hidden');

    this.landscape = true;
  },

  _generateMap: function(position, zoom, $el) {
    var map = new google.maps.Map($el, {
      zoom: zoom,
      center: position,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      draggable: !!this.landscape,
      draggable: true,
      panControl: false,
      zoomControl: !!this.landscape,
      zoomControl: true,
      scrollwheel: !!this.landscape,
      mapTypeControl: false,
      streetViewControl: false
    });

    map.set('styles', this._MAP_STYLES);

    return map;
  },

  _encodeAddressAndInitializeMap: function(location) {
    //console.log('#_encodeAddressAndInitializeMap')
    var zoom = _.has(location, 'address') ? 12 : 3;
    var mapEl = this.find('#map-canvas').get(0);

    this._geocode(location, function(geocodedLocation) {
      this.map = this._generateMap(geocodedLocation.position, zoom, mapEl)

      this._geocode(this.data.home, function(geocodedHome) {
        var marker = new google.maps.Marker({
          map: this.map,
          position: geocodedHome.position
        });
      }.bind(this));

      if (_.has(location, 'address')) {
        this.find('#map-canvas').on(this._transitionEnd(), function() {
          google.maps.event.trigger(this.map, 'resize');
        }.bind(this));
      }
    }.bind(this));
  },

  _setZoom: function() {
    //console.log('#_setZoom');

    var bounds = new google.maps.LatLngBounds();

    if (_.has(this, 'data.locations[0].position')) {
      bounds.extend(_.get(this, 'data.locations[0].position'));
    }
    if (_.has(this, 'data.locations[1].position')) {
      bounds.extend(_.get(this, 'data.locations[1].position'));
    }
    if (_.has(this, 'data.locations[2].position')) {
      bounds.extend(_.get(this, 'data.locations[2].position'));
    }
    if (_.has(this, 'data.locations[3].position')) {
      bounds.extend(_.get(this, 'data.locations[3].position'));
    }
    if (_.has(this, 'data.locations[4].position')) {
      bounds.extend(_.get(this, 'data.locations[4].position'));
    }
    if (_.has(this, 'data.home.position')) {
      bounds.extend(_.get(this, 'data.home.position'));
    }

    this.map.fitBounds(bounds);
  },

  _getMarkerColor: function(location) {
    var url = 'https://tool.votinginfoproject.org/images/';

    var pollingLocation = location.pollingLocation;
    var earlyVoteSite = location.earlyVoteSite;
    var dropOffLocation = location.dropOffLocation;

    if (pollingLocation && !earlyVoteSite && !dropOffLocation) {
      return url + 'blue-marker.png'
    }

    if (!pollingLocation && earlyVoteSite && !dropOffLocation) {
      return url + 'red-marker.png'
    }

    if (!pollingLocation && !earlyVoteSite && dropOffLocation) {
      return url + 'gray-marker.png'
    }

    return url + 'green-marker.png'
  },

  _addPollingLocation: function(location) {
    var url = this._getMarkerColor(location);

    var icon = {
      url: url,
      scaledSize: new google.maps.Size(23, 38),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(23, 35)
    };

    var addedLocations = _.filter(this.data.locations, function(location) { return _.get(location, 'marker') });

    var needsNudge = _.some(addedLocations, function (addedLocation) {
      var latDelta = addedLocation.position.lat() - location.position.lat();
      var lngDelta = addedLocation.position.lng() - location.position.lng();

      return latDelta == 0 && lngDelta == 0
    });

    var position = needsNudge
      ? new google.maps.LatLng(
        location.position.lat() * _.random(.999999, 1.000001),
        location.position.lng() * _.random(.999999, 1.000001)
      )
      : location.position;

    var marker = new google.maps.Marker({
      map: this.map,
      position: position,
      icon: icon
    });
    this.markers.push(marker);

    location.marker = marker;

    if (this.markers.length == 1) {
      if (_.has(this.data, 'currentLocation')) {
        var position = {
          lat: _.invoke(this, 'data.currentLocation.lat'),
          lng: _.invoke(this, 'data.currentLocation.lng')
        }
        this.map.panTo(position);
      } else {
        this.map.panTo(marker.getPosition());
      }
    }

    google.maps.event.addListener(location.marker, 'click', this._markerFocusHandler.bind(this, location));
  },

  _transitionEnd: function() {
    var i,
      undefined,
      el = document.createElement('div'),
      transitions = {
        'transition': 'transitionend',
        'OTransition': 'otransitionend',
        'MozTransition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd'
      };

    for (i in transitions) {
      if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
        return transitions[i];
      }
    }
  },

  _geocode: function(location, callback, error, count) {
    if (!count) {
      count = 0;
    }

    if (_.has(location, 'geocoded')) {
      callback(location);
      return;
    }

    var address = this._parseAddressWithoutName(
      _.get(location, 'address', 'United States of America')
    );

    this._geocoder.geocode({ 'address': address }, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var position = _.get(results, '[0].geometry.location');
        if (_.isUndefined(location)) {
          location = {};
        }
        location.position = position;
        location.geocoded = true;

        if (callback) {
          callback(location);
        }
      } else {
        if (error) {
          error(status);
        }

        if (!this.closed) {
          setTimeout(this._geocode.bind(this, location, callback, error, count + 1), this._GEOCODE_RETRY_TIMEOUT);
        }
      };
    }.bind(this));
  },

  _geocodeSequence: function(locations, normalizedInput) {
    _.forEach(locations, function(location) {
      this._geocode(location, this._addPollingLocation.bind(this));
    }.bind(this));
  },

  _parseZipCodes: function() {
    this.zipcodes = _.map(zipcodes, function(z) {
      var obj = {};
      _.forOwn(z, function(v, k) {
        obj[k] = parseFloat(v);
      });
      return obj;
    })
  },

  _sortLocations: function(primaryLocation) {
    var locations = this.data.locations;
    var zipcodeIndex = new BinarySearchIndex(this.zipcodes);

    // use the current location as the origin if
    // this has been supplied by the user
    var origin = _.has(this.data, 'currentLocation') ?
      _.get(this.data, 'currentLocation') :
      _.get(this.data, 'home.position');

    this.data.locations = _.sortBy(locations, function(l) {
      // we have not gotten the geocoded location for this position yet,
      // so we'll look up the lat/lng from its zip code and use that
      // to estimate distance
      if (_.isUndefined(l.position)) {
        var zip = _.get(l, 'address.zip', '0');

        // check if the zip is in the format xxxxx-xxxx and use first 5 digits
        if (zip.indexOf('-') != -1) {
          zip = zip.split('-')[0];
        }

        zip = _.toInteger(zip);
        var pos = zipcodeIndex.query(zip);

        l.position = new google.maps.LatLng(pos.lat, pos.lng);
        l.needsGeocoding = true;
      }
      return google.maps.geometry.spherical.computeDistanceBetween(
        origin, _.get(l, 'position')
      )
    }.bind(this))
  },

    // sort the contests by their placement on the ballot
  _contestComparator: function (firstContest, secondContest) {
    var firstPosition = _.toInteger(_.get(firstContest, 'ballotPlacement'));
    var secondPosition = _.toInteger(_.get(secondContest, 'ballotPlacement'));

    return firstPosition - secondPosition;
  },

  autocompleteListener: function() {
    if (this.hasSubmitted) return;

    var enteredAddress = this.autocomplete.getPlace();
    var addrStr = JSON.stringify(enteredAddress);
    if (typeof enteredAddress === 'undefined' ||
      typeof enteredAddress.formatted_address === 'undefined') {
      if (typeof enteredAddress !== 'undefined' && typeof enteredAddress.name !== 'undefined') enteredAddress = enteredAddress.name;
      else {
        // may not be necessary
        var autocompleteContainer = $('.pac-container').last().find('.pac-item-query').first();
        enteredAddress = autocompleteContainer.text() + ' ' +
          autocompleteContainer.next().text();
      }
    } else enteredAddress = enteredAddress.formatted_address;

    var enteredInput = this.find('.change-address').val();

    if (enteredInput.length > enteredAddress.length) enteredAddress = enteredInput;

    this.address = enteredAddress;

    this.closed = true;
    this.hasSubmitted = true;
    this._makeRequest({ address: enteredAddress });
  },

  changeAddress: function(e) {
    var addressInput = this.find('.change-address');

    // brings up change address bar if you click .address on left, but not if you click .address on map:
    if ($(e.currentTarget).hasClass("address") && $(e.currentTarget).closest("#location").length > 0) return;

    if (addressInput.is(':hidden')) {
      this.find("#vote-address-edit").hide();
      addressInput.prev().hide();
      addressInput.show().focus();
      this.find('#submit-address-button').show();
      if (!this.landscape) this.find('#fade').fadeTo('fast', .25);

      $('.pac-container').addClass('pac-nudge');

      addressInput.on('focus', function() {
        addressInput.val("");
      })

      $(window).on('keypress', function(e) {
        if (this.hasSubmitted) return;
        var key = e.which || e.keyCode;

        if (key === 13) {
          google.maps.event.trigger(this.autocomplete, 'place_changed');
          if (this.hasSubmitted) return;
          addressInput.replaceWith(addressInput.clone());
        }
      }.bind(this));

      google.maps.event.addListener(this.autocomplete, 'place_changed', this.autocompleteListener.bind(this));
    } else {
      this.find("#vote-address-edit").show();
      google.maps.event.clearInstanceListeners(this.autocomplete);

      addressInput.prev().show()
      addressInput.hide()
      this.find('#fade').fadeOut()
    }
  },

  changeElection: function (event) {
    //console.log('#changeElection');
    var $selected = $(event.currentTarget);

    if ($selected.hasClass('unselected')) {
      var electionId = $selected.find('.election-id').text();
      var address = this._parseAddress(_.get(this.data, 'normalizedInput'));

      this._makeRequest({
        address: address,
        electionId: electionId
      });
    }
  },

  _markerFocusHandler: function(location, saddr) {
    //console.log('#_markerFocusHandler')

    var $location = $(this.locationPartial({
      assets: this.assets,
      location: location,
      daddr: this._parseAddressWithoutName(_.get(location, 'address')),
      saddr: this._parseAddressWithoutName(_.get(this.data, 'home.address'))
    }));

    $location.find('#polling-location-info-close').on('click', this.closePollingLocationInfo.bind(this));

    this.find('#location').replaceWith($location).fadeOut('slow').fadeIn('slow');

    this.map.panTo(location.marker.getPosition())
  },

  toggleMap: function(event) {
    //console.log('#toggleMap');
    if (!this.landscape) {
      var canvas = this.find('#map-canvas');
      var toggle = this.find('#polling-location');
      var height = canvas.height() != 300 ? '300px' : '150px';
      toggle.find('.toggle-image').toggleClass('hidden');
      canvas.animate({ height: height }, {
        duration: 500,
        complete: function() {
          this._scrollTo(toggle, 10);
          this._setZoom();
        }.bind(this)
      });
    } else {
      this._disableRightPanelScroll();

      this._hideRightPanels();

      this._togglePane(this.find('#polling-location'));

      if (this.mapIsDisplayed)
        this.find('#map-canvas, #location, #location-legend').show();
      else
        this.find('#map-list-view').show();
    }
  },

  _getClosestLocation: function(locationCallback) {
    //console.log('#_getClosestLocation');
    var home = this.data.home;
    var locations = this.data.locations;

    var closestLocations = _.compact([
      _.first(locations),
      _.find(locations, function(l) {
        return !l.pollingLocation && l.earlyVoteSite && !l.dropOffLocation
      }),
      _.find(locations, function(l) {
        return !l.pollingLocation && !l.earlyVoteSite && l.dropOffLocation
      })
    ]);

    if (_.isEmpty(closestLocations)) {
      locationCallback(_.undefined)
    } else {
      this._geocode(home, _.bind(this._closestLocationTo, this, locationCallback, closestLocations));
    }
  },

  _closestLocationTo: function (callback, locations, destination) {
    var closestDist = Infinity;
    var closestLocation;

    async.each(locations, function(location, step) {
      this._geocode(location, function(geocodedLocation) {
        var dist = google.maps.geometry.spherical.computeDistanceBetween(destination.position, geocodedLocation.position);
        if (dist < closestDist) {
          closestDist = dist;
          closestLocation = location;
        }
        step();
      });
    }.bind(this), function(err) {
      if (err) throw err;

      callback(closestLocation);
    })
  },

  toggleElections: function (event) {
    if (_.isUndefined(this.data.otherElections)) {
      return;
    }

    event.stopPropagation();

    this.find('#election-list').slideToggle(100, function() {
      if (!this.landscape) this._scrollTo($('#more-elections span'), 10)
    }.bind(this));

    this.find('#more-elections .toggle-image').toggleClass('hidden');
  },

  toggleResources: function() {
    if (!this.landscape) {
      this._scrollTo($('#resources-toggle'), 10);
      this.find('#resources-toggle .toggle-image').toggleClass('hidden');
      this.find('#more-resources').slideToggle();
    } else {
      this._enableRightPanelScroll();

      this.$el
        .find('#about-resources')
        .css("height", "initial")
        .show()
        .find('span')
        .show()

      this._hideRightPanels();
      this._togglePane(this.find('#resources-toggle'));

      this.find('#more-resources').css({ 'max-height': '20000px' }).show();
    }
  },

  toggleBallot: function() {
    //console.log('#toggleBallot');
    var $ballotInfo = this.find('#ballot-information');

    if (!this.landscape) {
      $ballotInfo.find('.toggle-image').toggleClass('hidden');

      if ($ballotInfo.find('.contracted').is(':hidden')) {
        this._scrollTo($("#ballot-information"), 20);
      }
    } else {
      this._enableRightPanelScroll();
      this._hideRightPanels();
      this._togglePane(this.find('#ballot-information'));

      this.find('.contests').show();
    }
  },

  _togglePane: function ($activeEl) {
    var $expandedPane = this.find('.expanded-pane');

    $expandedPane.removeClass('expanded-pane');
    $expandedPane.find('.toggle-image').toggleClass('hidden');

    $activeEl.addClass('expanded-pane');
    $activeEl.find('.toggle-image').toggleClass('hidden');
  },

  _hideRightPanels: function() {
    this.find('#map-canvas, #location, #location-legend, #map-list-view, #map-view-toggle, #more-resources, #about-resources, #all-contests').hide()
  },

  _enableRightPanelScroll: function() {
    this.find('.right-wrapper')
      .css({ 'overflow-y': 'scroll', 'overflow-x': 'hidden' })
      .scrollTop(0);
  },

  _disableRightPanelScroll: function () {
    this.find('.right-wrapper')
      .css('overflow', 'hidden')
      .scrollTop(0);
  },

  toggleAllContests: function() {
    var $allContests = this.find('.contest');
    var $allCandidateLists = $allContests.find('.candidate-list');
    var $allToggles = $allContests.find('span');

    $allCandidateLists.slideToggle();
    $allToggles.toggleClass('plus-sign');
  },

  toggleContest: function(e) {
    //console.log('#toggleContest');
    var $contest = $(e.currentTarget).parent();
    var candidateList = $contest.find('.candidate-list');
    var toggle = $contest.find('span');

    candidateList.slideToggle(500, function() { toggle.toggleClass('plus-sign')});
  },

  toggleMapListView: function() {
    this.mapIsDisplayed = !this.mapIsDisplayed;
    this.find('#map-list-view, #location, #location-legend, #map-canvas').toggle();
    this.find('#about-resources').hide();
  },

  submitAddress: function() {
    google.maps.event.trigger(this.autocomplete, 'place_changed');
  },

  _scrollTo: function(target, padding) {
    $(this.$container).animate({
      scrollTop: target.offset().top - $(this.$container).offset().top + $(this.$container).scrollTop() - padding
    }, 500);
  },

  showPlaceAutocomplete: function() {
    $('.pac-container').last().css('z-index', 100000);
  },

  back: function() {
    this.closed = true;
    this.triggerRouteEvent('mapViewBack');
  },

  openAboutModal: function(e) {
    this.find('#about').fadeIn('fast');
    this.find('#fade').fadeTo('fast', .2);
    e.stopPropagation();
  },

  closeAboutModal: function() {
    this.find('#about').fadeOut('fast')
    this.find('#fade').fadeOut('fast')
  },

  closeAlert: function() {
    this.find('#alert').addClass('zero-opacity');
    setTimeout(this.removeAlert.bind(this), 1000);
  },

  removeAlert: function() {
    this.find('#alert').remove();
  },

  closeAddressNotFound: function() {
    this.find('#address-not-found').hide();
  },

  closeLocationLegend: function() {
    this.find('#location-legend').fadeOut('fast');
  },

  closePollingLocationInfo: function() {
    this.find('#location').fadeOut('fast');
  },

  panToFirstPollingLocation: function() {
    var pollingLocation = _.find(this.data.locations, function (l) { return l.pollingLocation });
    if (!_.isUndefined(pollingLocation)) {
      this._markerFocusHandler.call(this, pollingLocation);
    }
  },

  panToFirstEarlyVoteSite: function() {
    var earlyVoteSite = _.find(this.data.locations, function (l) {
      return !l.pollingLocation && l.earlyVoteSite && !l.dropOffLocation
    });
    if (!_.isUndefined(earlyVoteSite)) {
      this._markerFocusHandler.call(this, earlyVoteSite);
    }
  },

  panToFirstDropoffLocation: function() {
    var dropOffLocation = _.find(this.data.locations, function (l) {
      return !l.pollingLocation && !l.earlyVoteSite && l.dropOffLocation
    });
    if (!_.isUndefined(dropOffLocation)) {
      this._markerFocusHandler.call(this, dropOffLocation);
    }
  },

  panToFirstMultiSite: function() {
    var multiSite = _.find(this.data.locations, function (l) {
      return (
        l.pollingLocation && l.earlyVoteSite ||
        l.pollingLocation && l.dropOffLocation ||
        l.earlyVoteSite && l.dropOffLocation
      )
    })
    if (!_.isUndefined(multiSite)) {
      this._markerFocusHandler.call(this, multiSite);
    }
  },

  parseTime: function(date) {
    // console.log(date)
    var times = date.split("-");
    var rx = /\d*/;
    var pmAdjust;
    for (var i = 0; i < times.length; i++) {
      pmAdjust = (/pm/.test(times[i]) ? 12 : 0);

      times[i] = parseInt(rx.exec(times[i].replace(/ /g, '')[0]));
      times[i] = times[i] + pmAdjust;
    }

    if (times[0] && times[1]) {
      return times;
    } else {
      return false;
    }
  }
});
