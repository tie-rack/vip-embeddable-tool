var View = require('./view.js');
var api = require('../api.js');
var $ = require('jquery');
var fastclick = require('fastclick');
var ouiCal = require('../ouical.js');
var _ = require('lodash');
var async = require('async');
var LocationMatcher = require('../locationMatcher');
var zipcodes = require('../zipcodes');
var BinarySearchIndex = require('tiny-binary-search');

module.exports = View.extend({

  $id: 'map-view',

  template: require('./templates/map.hbs'),

  addressPartial: require('./templates/partials/address.hbs'),

  pollingLocationPartial: require('./templates/partials/polling-location-info.hbs'),

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

  onBeforeRender: function(options) {
    var that = this;

    $("#_vit").css("max-width", "800px")
    $("#_vit .footer").css("max-width", "800px")

    if (navigator.userAgent.match('CriOS')) {
      $('<meta>')
        .attr('name', 'viewport')
        .attr('content', 'width=device-width,initial-scale=0.75')
        .attr('id', 'viewport-mobile-web-tag')
        .appendTo($('head'));
    }

    $(this.$container).css('-webkit-overflow-scrolling', 'touch');

    options.data.locations = LocationMatcher(options.data);

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
    var primaryParties = _.uniq(_.map(closedPrimaries, function(p) { return _.get(primary, 'primaryParty') }));
    _.forEach(primaryParties, function(party) {
      if (!_.has(data, 'closedPrimaries')) {
        _.set(data, 'closedPrimaries', {});
      }
      options.data.closedPrimaries[party] = _.union(_.filter(closedPrimaries, function(primary) {
        return primary.primaryParty == party;
      }), openPrimaries);
    });

    this.data = options.data;

    $('<div id="_vitModal">')
      .prependTo($('html'));

    if (options.modal) {
      this.modal = true;
      this.initialParent = $("#_vit").parent();
      $("#_vit").prependTo($('html'));
    }
  },

  _resizeHandler: function() {
    if (!this.modal) {
      if (this.$container.parent().width() < this.$container.width())
        this.$container.width(this.$container.parent().width());

      if (this.$container.width() < 500) {
        // set to mobile view
        this.landscape = false;
        this.$container.css({
          'overflow-y': 'scroll',
          'overflow-x': 'hidden'
        })
      } else {
        this.landscape = true;
        this.$container.width(this.width);
        this.$container.height(this.height)
        if (this.$container.width() < 600) {
          this.find('.info').css({
            'font-size': '14px'
          });
          this.find('.election').css({
            'font-size': '16px'
          });
          this.find('.subsection').css({
            'font-size': '15px'
          });
          this.find('.right .box').css({
            'padding': '5px 15px'
          });
          this.find('#more-resources h1').css({
            'font-size': '16px'
          });
        } else {
          if (this.$container.height() < 480) {
            // $('.left-wrapper')[0].style['overflow-y'] = 'auto';
            // $('.left-wrapper')[0].style['overflow-x'] = 'hidden';
            // css({
            //   overflowY: 'auto',
            //   overflowX: 'hidden'
            // })
          }
        }
      }
      return;
    }

    var width = $(window).width(),
      height = $(window).height(),
      screenWidth = screen.availWidth,
      screenHeight = screen.availHeight;

    if (!$('#viewport-mobile-web-tag').length) {
      $('<meta>')
        .attr('name', 'viewport')
        .attr('content', 'width=device-width,initial-scale=1.0')
        .attr('id', 'viewport-mobile-web-tag')
        .appendTo($('head'));
    }

    if (screenWidth < 600) {
      this.$container.width(window.innerWidth);
      this.$container.height(window.innerHeight);
      this.landscape = false;

      // this.find('.box,#map-canvas').width(window.innerWidth);
      this.find('#map-canvas').width(window.innerWidth);
      // this.find('.box').width(window.innerWidth)

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

      $('#_vitModal').css({
        'width': width,
        'height': height
      })

      this.landscape = true;
    }

    if (this.modal && !this.landscape) {
      this.$container
        .addClass('floating-container')
      $('html, body')
        .removeClass('max-height')
        .find('body')
        .addClass('no-scroll');
    } else if (this.modal && this.landscape) {
      this.$container
        .addClass('floating-modal-container')
      $('html, body')
        .addClass('max-height')
        .find('body')
        .removeClass('no-scroll')
    }

    $(window)
      .scrollTop(0)
      .scrollLeft(0)
  },

  submitErrorForm: function(event) {
    event.preventDefault();

    this.find('#error-feedback-form').submit();
  },

  _initializeMap: function (primaryLocation) {
    if (_.isUndefined(primaryLocation)) {
      this._encodeAddressAndInitializeMap();
      return;
    }

    this._encodeAddressAndInitializeMap(primaryLocation);

    this._sortLocations(primaryLocation);

    var $location = $(this.locationPartial({
      location: primaryLocation,
      daddr: this._parseAddressWithoutName(_.get(primaryLocation, 'address')),
      saddr: this._parseAddressWithoutName(_.get(this.data, 'home.address'))
    }));

    $location.insertBefore(this.find('#map-canvas'));


    this._setZoom();

    this._geocodeSequence(this.data.locations, this.data.normalizedInput);
  },

  onAfterRender: function(options) {

    if (options.alert)
      this.find('#alert')
      .find('#text')
      .html(options.alert)
      .end()
      .show();

    this.width = options.width;
    this.height = options.height;

    this.prevWidth = this.$container.width();
    this.prevHeight = this.$container.height();
    this.prevLeft = this.$container.css('left');
    this.prevTop = this.$container.css('top');

    $(window).on('resize.mapview', this._resizeHandler.bind(this));

    this._resizeHandler();

    setTimeout(this._resizeHandler.bind(this), 250);

    if (options.alert && this.landscape)
      this.find('#location-legend')
      .css('top', '11%');

    var that = this;

    this._getClosestLocation(this._initializeMap.bind(this));

    if (this.landscape) this._switchToLandscape(options);


    if (options.data.state &&
      options.data.state.length &&
      options.data.state[0].electionAdministrationBody)
      this.find('#info-icon').parent().attr('href', options.data.state[0].electionAdministrationBody.electionInfoUrl);

    $('html,body').scrollLeft($(this.$container).scrollLeft());
    $('html,body').scrollTop($(this.$container).scrollTop());

    var myCalendar = createOUICalendar({
      options: {
        notClass: 'add-to-calendar-drop-class',
        id: 'add-to-calendar-dropdown'
      },
      data: {
        title: options.data.election.name,
        start: new Date(options.data.election.dateForCalendar),
        duration: 1440,
        address: this._parseAddress(_.first(this.data.locations)),
        description: options.data.election.name
      }
    });

    if (this.landscape) {
      this.find('.info.box').removeClass('expanded-pane');
      this.find('#polling-location').addClass('expanded-pane')
      this.find(':not(#polling-location) .right-arrow').removeClass('hidden');
      this.find(':not(#polling-location) .left-arrow').addClass('hidden');
      this.find('#polling-location .right-arrow').addClass('hidden');
      this.find('#polling-location .left-arrow').removeClass('hidden');
      this.find('#more-resources, .contests').hide();
    }

    document.querySelector('#calendar-icon').appendChild(myCalendar);

    if (this.$container.height() < 465) {
      this.find('.left-overflow-wrapper').find('.left-wrapper').css({
        'overflow-y': 'auto',
        'overflow-x': 'hidden'
      });
    }

    fastclick(document.body);

    // if (!this.landscape) this._preventiOSBounce();

    this.autocomplete = new google.maps.places.Autocomplete(this.find('.change-address')[0], {
      types: ['address'],
      componentRestrictions: {
        country: 'us'
      }
    });

    // this.earlyVoteSites = options.data.earlyVoteSites;
    // this.dropOffLocations = options.data.dropOffLocations;
    // if ((this.earlyVoteSites || this.dropOffLocations || this.locationTypes.hasPollingLocations) && this.landscape)
    //   this.find('#location-legend')
    //   .show()

    // _.forEach(options.data.locations, function(location) {

    // }.bind(this));

    // if (!options.data.contests)
    //   this.find('#ballot-information')
    //   .remove()

    window.setTimeout(this.closeAlert.bind(this), 8000);

    this.find('.change-address').on('keypress', function() {
      $('.pac-container').last().css('z-index', 100000);
    });

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

    $('#_vitModal').remove();

    if (this.modal) {
      $("#_vit").prependTo($(this.initialParent));
    }

    $('#viewport-mobile-web-tag').remove();

    $(window).off('.mapview');
  },

  _modifyExternals: function() {
    $('html, body')
      .addClass('max-height')
      .find('#_vitModal')
      .show()
      .one('click', function() {
        $(this).hide();
        this.triggerRouteEvent('mapViewBack')
      }.bind(this))
      .end()
  },

  _preventiOSBounce: function() {
    var allowUp, allowDown, slideBeginY, slideBeginX;
    this.$container.on('touchstart', function(event) {
      allowUp = (this.scrollTop > 0);
      allowDown = (this.scrollTop < this.scrollHeight - this.clientHeight);
      slideBeginY = event.originalEvent.pageY;
      slideBeginX = event.originalEvent.pageX
    });

    this.$container.on('touchmove', function(event) {
      var up = (event.originalEvent.pageY > slideBeginY);
      var down = (event.originalEvent.pageY < slideBeginY);
      var horizontal = (event.originalEvent.pageX !== slideBeginX);
      $(window).scrollLeft(0);
      slideBeginY = event.originalEvent.pageY;
      if (((up && allowUp) || (down && allowDown))) {} else {
        event.preventDefault();
      }
    });
  },

  _switchToLandscape: function(options) {
    if (this.modal) this._modifyExternals();
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
      .find('.right')
      .wrapAll('<div class="right-wrapper" />')
      .end()
      .find('.toggle-image')
      .addClass('arrow')
      .filter('.plus')
      .attr('src', 'https://tool.votinginfoproject.org/images/left-arrow-white.png')
      .addClass('right-arrow')
      .end()
      .filter('.minus')
      .attr('src', 'https://tool.votinginfoproject.org/images/right-arrow-white.png')
      .addClass('left-arrow')
      .end()
      .find('#polling-location .arrow')
      .toggleClass('hidden')
      .end()
      .find('#more-resources, .contests.right')
      .hide()
      .end()

    this.landscape = true;
  },

  _generateMap: function(position, zoom, $el) {
    var options = {
      zoom: zoom,
      center: position,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      draggable: false,
      panControl: false,
      zoomControl: false,
      scrollwheel: false,
      mapTypeControl: false,
      streetViewControl: false
    };
    if (this.landscape) {
      options.draggable = true;
      options.scrollWheel = true;
      options.zoomControl = true;
    }
    var map = new google.maps.Map($el, options)
    map.set('styles', [{
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
    }]);
    return map;
  },

  _encodeAddressAndInitializeMap: function(location) {
    console.log('#_encodeAddressAndInitializeMap')
    var that = this;
    var zoom = _.has(location, 'address') ? 12 : 3;
    var mapEl = that.find('#map-canvas').get(0);

    this._geocode(location, function(geocodedLocation) {
      var mapCenter = this.data.currentLocation || geocodedLocation;
      // that.map = that._generateMap((currentLocation ? currentLocation : geocodedLocation.position), zoom, that.find('#map-canvas').get(0));
      this.map = this._generateMap(geocodedLocation.position, zoom, mapEl)
      console.log(mapCenter)
      this._geocode(that.data.home, function(geocodedHome) {
        var marker = new google.maps.Marker({
          map: this.map,
          position: geocodedHome.position
        });
      }.bind(this));

      if (_.has(location, 'address')) {
        // google.maps.event.addListener(that.map, 'click', function() {
        //   if (that.landscape) {
        //     // that.find('.polling-location-info').slideUp('fast');
        //     that.toggleMap();
        //     // that.map.panTo((currentLocation ? currentLocation : position))
        //   }
        //   if (this.data.currentLocation)
        //     that.map.panTo(this.data.currentLocation)
        //   else
        //     that._fitMap();

        //   // that.map.panTo(position)
        //   // that.find('#location .address').replaceWith($(that.addressPartial(address)));
        //   that.find('#location').hide();

        //   // if (currentLocation)
        //   // that.map.panTo(currentLocation)
        // });

        that.find('#map-canvas').on(that._transitionEnd(), function() {
          google.maps.event.trigger(that.map, 'resize');
        });

      } else {
        that.find('#location')
          .find('a')
          .remove()
          .end()
          .find('.address')
          .css('text-align', 'center')
          .text('No Polling Locations Found')
      }
    }.bind(this), function(status) {

    });
  },

  _fitMap: function() {
  },

  _setZoom: function() {
    console.log('#_setZoom');
    var bounds = new google.maps.LatLngBounds();

    bounds.extend(_.get(this, 'data.locations[0].position'));
    bounds.extend(_.get(this, 'data.home.position'));

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
    var that = this;
    console.log('#_addPollingLocation');

    var url = this._getMarkerColor(location);

    var icon = {
      url: url,
      scaledSize: new google.maps.Size(23, 38),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(23, 35)
    };

    var marker = new google.maps.Marker({
      map: this.map,
      position: location.position,
      icon: icon
    });
    this.markers.push(marker);

    location.marker = marker;

    if (this.markers.length == 1) {
      this.map.panTo(marker.getPosition())
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

        // setTimeout(this._geocode.bind(this, location, callback, error, count + 1), this._GEOCODE_RETRY_TIMEOUT);
      };
    }.bind(this));
  },

  _geocodeSequence: function(locations, normalizedInput) {
    _.forEach(locations, function(location) {
      this._geocode(location, this._addPollingLocation.bind(this));
    }.bind(this));
  },

  _sortLocations: function(primaryLocation) {
    var locations = this.data.locations;
    var zipcodeIndex = new BinarySearchIndex(zipcodes);

    this.data.locations = _.sortBy(locations, function(l) {
      // we have not gotten the geocoded location for this position yet,
      // so we'll look up the lat/lng from its zip code and use that
      // to estimate distance
      if (_.isUndefined(l.position)) {
        var zip = _.toInteger(_.get(l, 'address.zip'));
        var pos = zipcodeIndex.query(zip);

        l.position = new google.maps.LatLng(pos.lat, pos.lng);
        l.needsGeocoding = true;
      }
      return google.maps.geometry.spherical.computeDistanceBetween(
        _.get(this.data, 'home.position'), _.get(l, 'position')
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

    this.hasSubmitted = true;
    this._makeRequest({
      address: enteredAddress
    });

    // this.toggleLoadingDisplay();
  },
  changeAddress: function(e) {
    var that = this;
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

  changeElection: function(e) {
    var selected = $(this).firstElementChild;

    if ($(selected).hasClass('hidden')) {
      var electionId = selected.nextElementSibling.nextElementSibling.innerHTML;
      var address = this._parseAddress(this.data.normalizedInput);
      api({
        address: address,
        success: function(response) {
          this.triggerRouteEvent('mapViewSubmit', response)
        }.bind(this),
        electionId: electionId
      });
    }
  },

  _markerFocusHandler: function(location, saddr) {
    console.log('#_markerFocusHandler')

    var $location = $(this.locationPartial({
      location: location,
      daddr: this._parseAddressWithoutName(_.get(location, 'address')),
      saddr: this._parseAddressWithoutName(_.get(this.data, 'home.address'))
    }));

    // slide up the current polling location information partial
    // and then replace its information with new
    this.find('#location').replaceWith($location).fadeOut('slow').fadeIn('slow');

    this.map.panTo(location.marker.getPosition())

    // this.toggleMap.call(this, null, location.marker, location.address);
  },

  toggleMap: function(e, marker, address) {
    console.log('#toggleMap');
    var markerSelected = true;
    if (typeof marker === 'undefined') {
      markerSelected = false;
      marker = this.markers[0];
    }
    if (!this.landscape) {
      var canvas = this.find('#map-canvas');
      var toggle = this.find('#map-toggle');
      if (canvas.height() !== 300 && (!markerSelected)) {
        toggle.find('.minus').removeClass('hidden');
        toggle.find('.plus').addClass('hidden');

        canvas.animate({
          height: '300px'
        }, {
          duration: 500,
          complete: function() {
            this._scrollTo(toggle, 10);
            // this.map.panTo(marker.getPosition());
            this._fitMap();
          }.bind(this)
        });

        if (address) this.find('#location .address').replaceWith($(this.addressPartial(address)));
        this.find('.polling-location-info').slideDown('fast');
      } else if (!markerSelected) {
        canvas.animate({
          height: '150px'
        }, {
          duration: 500,
          complete: function() {
            this._scrollTo(toggle, 10);
            console.log('#panto')
            this.map.panTo(marker.getPosition());
            this.map.setZoom(12);
            // this._fitMap();
          }.bind(this)
        });
        toggle.find('.plus').removeClass('hidden');
        toggle.find('.minus').addClass('hidden');

        this.find('.polling-location-info').slideUp('fast');
      } else {
        console.log('#panto')
        this.map.panTo(marker.getPosition());
        var isSameLocation = (this.find('#location .address').text() === $(this.addressPartial(address)).text());
        if (address) this.find('#location .address').replaceWith($(this.addressPartial(address)));
        if (isSameLocation) this.find('.polling-location-info').slideToggle('fast');
        else this.find('.polling-location-info').slideUp('fast');
      }
    } else {
      if (this.find('#location').is(':visible')) {
        console.log('already at map...')
        // this._fitMap();
        console.log('#panto')
        this.map.panTo(marker.getPosition());
        if (address) {
          var isSameLocation = (this.find('#location .address').text() === $(this.addressPartial(address)).text());
          if (isSameLocation) this.find('.polling-location-info').show();
          else {
            this.find('#location .address').replaceWith($(this.addressPartial(address)));
            this.find('.polling-location-info').show();
            if (this.find('.polling-location-info').is(':hidden')) {
              // this.find('.polling-location-info').slideDown('fast');
            } else {
              // setTimeout(function() {
              // this.find('.polling-location-info').slideDown('fast');
              // }.bind(this), 500);
            }
          }
        }
      } else {
        console.log('navigating to map...')
        this._disableRightPanelScroll();

        this._hideRightPanels();

        this._togglePane(this.find('#polling-location'));

        if (this.mapIsDisplayed)
          this.find('#map-canvas, #location, #location-legend').show();
        else
          this.find('#map-list-view').show();

        console.log('#panto');
        // this.map.panTo(marker.getPosition());
      }
    }

    // var addressNames = this.find('#location .address-name');
    // if (addressNames.length > 1 &&
    //   (addressNames.first().text() === addressNames.last().text()))
    //   addressNames.first().remove();
  },

  _getClosestLocation: function(locationCallback) {
    console.log('#_getClosestLocation');
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

  toggleElections: function(e) {
    if (typeof this.data.otherElections === 'undefined') return;
    e.stopPropagation();
    this.find('#election-list').slideToggle(100, function() {
      if (!this.landscape) this._scrollTo($('#more-elections span'), 10)
    }.bind(this));
    if (!this.landscape)
      this.find('#more-elections')
      .find('.toggle-image').toggleClass('hidden');
  },

  toggleResources: function(e) {
    if (!this.landscape)
      this.find('#more-resources').slideToggle(500, function() {
        this._scrollTo($('#resources-toggle span'), 10);
        this.find('#resources-toggle')
          .find('.plus, .minus')
          .toggleClass('hidden');
      }.bind(this));
    else {
      this._enableRightPanelScroll();

      this.$el
        .find('#about-resources')
        .css("height", "initial")
        .show()
        .find('span')
        .show()

      this._hideRightPanels();

      this._togglePane(this.find('#resources-toggle'));

      this.find('#more-resources')
        .css({
          'max-height': '20000px'
        }).show();
    }
  },

  toggleBallot: function() {
    console.log('#toggleBallot');

    var $ballotInfo = this.find('#ballot-information');

    if (!this.landscape) {

      $ballotInfo.find('.toggle-image').toggleClass('hidden');
      _.each(this.find('.contest-toggle'), function(el) { $(el).trigger('click') });

      if ($ballotInfo.find('.plus').is(':hidden')) {
        this._scrollTo($("#ballot-information"), 20);
      }

    } else {

      this._enableRightPanelScroll();

      this._hideRightPanels();

      this._togglePane(this.find('#ballot-information'));

      this.find('.contests').show()
    }
  },

  _togglePane: function ($activeEl) {
    var $panes = this.find('.info.box');

    $panes.removeClass('expanded-pane');
    $panes.find('.right-arrow').removeClass('hidden');
    $panes.find('.left-arrow').addClass('hidden');

    $activeEl.addClass('expanded-pane');
    $activeEl.find('.right-arrow').addClass('hidden');
    $activeEl.find('.left-arrow').removeClass('hidden');
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

  toggleContest: function(e) {
    console.log('#toggleContest');
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

  back: function() {
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
    this.find('#alert').fadeOut('slow', function() {
      if (this.find('#location-legend').is(':visible'))
        this.find('#location-legend')
        .css('top', '2%');
    }.bind(this));
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
  }
});