var View = require('./view.js');
var api = require('../api.js');
var $ = require('jquery');
var colors = require('../colors.js');

module.exports = View.extend({

  $id          : 'address-view',

  template     : require('./templates/address-lookup.hbs'),

  multipleElections : require('./templates/partials/multiple-elections.hbs'),

  mailOnly     : require('./templates/partials/mail-only.hbs'),

  events : {
    '#plus-icon click' : 'openAboutModal',
    '#close-button click' : 'closeAboutModal',
    '#submit-address-button click' : 'submitAddress',
    '#use-current-location click' : 'useCurrentLocation',
    '#use-registered-address click' : 'useRegisteredAddress',
    '#use-different-address click' : 'useDifferentAddress',
    '#out-of-state click' : 'useRegisteredAddress'
  },

  hasSubmitted: false,

  address : '',

  resizer: function () {
    // constrain container to parent width
    if (this.$container.parent().width() < this.$container.width()) {
      this.$container.width(this.$container.parent().width());
    }
  },

  onAfterRender : function(options) {
    this.$addressInput = this.find('#address-input');
    this.$aboutModal = this.find('#about');
    this.$notFoundModal = this.find('#address-not-found');
    this.$currentLocationModal = this.find('#current-location');
    this.$fade = this.find('#fade');
    this.$loading = this.find('.loading');
    this.$outOfStateModal = this.find('#out-of-state');

    // set theme
    if (options.theme)
      this.$el.css({background: "url(" + options.theme + ") no-repeat 50% 0"});

    // set container dimensions
    this.$container.css({
      'max-width': 'none',
      'width' : options.width,
      'height' : options.height
    });

    if (options.modal) {
      this.$container.addClass('vit-modal unexpanded');
    }

    // limit user-uploaded image width
    if (this.$container.width() > 600) {
      $('#user-image').css('max-width', '85%');
    }

    // apply custom colors
    if (options.colors) {
      colors.replace(options.colors);
    }

    // handle container clicks and hide modals
    this.$container.on('click', this.containerClick.bind(this));

    this.autocomplete = new google.maps.places.Autocomplete(this.$addressInput[0], {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    });

    // debounce submissions
    this.hasSubmitted = false;

    // disable fast-click for place autocomplete by listening for DOM Node
    // Insertion. PAC doesn't work with fastlick. See:
    // https://github.com/ftlabs/fastclick/issues/316
    $(document).on({
      DOMNodeInserted: function() {
        $('.pac-item, .pac-item span', this).addClass('needsclick');
      }
    }, '.pac-container');

    // bind resize event
    // note: debounce
    this.resizer();
    $(window).on('resize', this.resizer.bind(this));

    // bind autocomplete listener
    google.maps.event.addListener(this.autocomplete, 'place_changed', this.autocompleteListener.bind(this));
  },

  autocompleteListener: function () {
    // TODO: replace this with a debouncer
    if (this.hasSubmitted) return;

    if (this.autocomplete.getPlace()) {
      this.address = this.autocomplete.getPlace().formatted_address || this.autocomplete.getPlace().name;
    } else {
      this.address = this.$addressInput.val();
    }

    // OVERRIDE: if what is in the text box is lengthier than the PAC address, use the former
    if (this.address.length < this.$addressInput.val().length) {
      this.address = this.$addressInput.val();
    }

    this.hasSubmitted = true;

    this._makeRequest({
      address: this.address
    });

    this.toggleLoadingDisplay();
  },

  currentLocationAutocompleteListener: function (response) {
    var address = this.autocomplete.getPlace().formatted_address || this.autocomplete.getPlace().name;

    var stateName = (response.state && response.state.length) ? response.state[0].name : '';
    var stateAbbr = (stateName === 'Washington' ? 'WA' : 'OR');

    if (address.indexOf(stateAbbr) !== -1) {

      if (!this.autocomplete.getPlace().geometry) {

        this._geocode(this.autocomplete.getPlace().name, function(geocodedLocation) {
          $.extend(response, { currentLocation: geocodedLocation });

          this.triggerRouteEvent('addressViewSubmit', response);
        }.bind(this))

      } else {
        var location = this.autocomplete.getPlace().geometry.location;

        $.extend(response, { currentLocation: location });

        this.triggerRouteEvent('addressViewSubmit', response);
      }

      this.toggleLoadingDisplay();
    } else {

      this.$loading.hide();
      this.$currentLocationModal.hide();
      this.$outOfStateModal.fadeIn('fast')
    }
  },

  submitAddress: function () {
    google.maps.event.trigger(this.autocomplete, 'place_changed');
  },

  onRemove: function() {
    this.$container.removeClass('unexpanded');

    google.maps.event.clearInstanceListeners(this.autocomplete);
  },

  handleElectionData: function(response) {
    var that = this;

    window.console && console.log(response)

    this.response = response;

    var stateName = _.get(this.response, 'state[0].name');
    if (response.mailOnly) {
      this.showMailOnlyModal();
    } else if (stateName === 'Washington' || stateName === 'Oregon') {
      this.showCurrentLocationModal();
    } else if (response.otherElections) {
      this.showMultipleElectionsModal();
    } else this.triggerRouteEvent('addressViewSubmit', response);
  },

  selectElection: function(e) {
    var electionId = e.currentTarget.querySelector('.hidden');
    this.triggerRouteEvent('');
  },

  openAboutModal: function(e) {
    this.find('#fade').fadeTo('fast', .2);
    this.find('#about').fadeIn('fast')

    if ( ($("#_vit").find("#about.modal").find("p").height() + $("#_vit").find("#about.modal").find("h2").height()) > ($("#_vit").height() - 120) ) {
      $("#_vit").find("#about.modal").find("#close-button").hide();
       $("#_vit").find("#about.modal").find(".close-modal-text-button").toggle();
    }

    e.stopPropagation();
  },

  closeAboutModal: function() {
    this.find('#about').fadeOut('fast');
    this.find('#fade').fadeOut('fast');
  },

  containerClick: function (event) {
    var $this = $(this);

    if (!$this.is(this.$aboutModal)) {
      this.$aboutModal.hide();
    }

    if (!$this.is(this.$notFoundModal)) {
      this.$notFoundModal.hide();
    }

    if (!$this.is(this.$currentLocationModal)) {
      this.$currentLocationModal.hide();
    }

    if (!$this.is(this.$fade)) {
      this.$fade.fadeOut('fast');
    }
  },

  showMultipleElectionsModal: function () {
    this.$el.append(this.multipleElections({
      elections: [this.response.election].concat(this.response.otherElections)
    }));

    var $multipleElections = this.find('#multiple-elections');

    $multipleElections.fadeIn();
    this.$fade.fadeTo('fast', .2);
    $multipleElections.find('.checked:first').removeClass('hidden');
    $multipleElections.find('.unchecked:first').addClass('hidden');

    $multipleElections.find('button').on('click', function () {
      var id = $multipleElections.find('.checked:not(.hidden)').siblings('.hidden').eq(1).text();

      this._makeRequest({
        address: this._parseAddress(response.normalizedInput),
        success: function(newResponse) {
          this.triggerRouteEvent('addressViewSubmit', newResponse);
        }.bind(this),
        electionId: id
      });

    }.bind(this));

    $multipleElections.find('.election').on('click', function() {
      $multipleElections.find('.checked').addClass('hidden');
      $multipleElections.find('.unchecked').removeClass('hidden')
      $(this).find('.checked').removeClass('hidden');
      $(this).find('.unchecked').addClass('hidden');
    }.bind(this));
  },

  showCurrentLocationModal: function () {
    this.$currentLocationModal.fadeIn();
    this.$fade.fadeTo('fast', .2);
    this.$loading.hide();
  },

  showMailOnlyModal: function () {
    this.$el.append(this.mailOnly(this.response));

    var $mailOnly = this.find('#mail-only');
    $mailOnly.fadeIn();
    $mailOnly.find('button').on('click', function() {
      this.triggerRouteEvent('addressViewSubmit', this.response);
    }.bind(this));

    this.$fade.fadeTo('fast', .2);
    this.$loading.hide();
  },

  useCurrentLocation: function () {
    this.$currentLocationModal.fadeOut();
    this.$loading.show();

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var lat = _.get(position, 'coords.latitude');
        var lng = _.get(position, 'coords.longitude');
        this._reverseGeocode(lat, lng,
          this._makeRequestWithCurrentLocation.bind(this, lat, lng));
      });
    } else {
      this.triggerRouteEvent('addressViewRerender');
    }
  },

  useRegisteredAddress: function () {
    this.triggerRouteEvent('addressViewSubmit', this.response);
  },

  useDifferentAddress: function () {
    var newInput = $('<input>')
      .attr('type', 'text')
      .attr('placeholder', "Enter a different address")
      .css('margin', '10px 0 0')
      .insertBefore('#current-location span');

    this.autocomplete = new google.maps.places.Autocomplete(newInput[0], {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    });

    google.maps.event.addListener(this.autocomplete, 'place_changed', that.currentLocationAutocompleteListener.bind(that, response));
  },

  _reverseGeocode: function(lat, lng, callback) {
    var latLng = new google.maps.LatLng(lat, lng);
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
      'latLng': latLng
    }, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK && results.length)
        callback(results[0].formatted_address);
    })
  },

  _makeRequestWithCurrentLocation: function (lat, lng, address) {
    var stateName = _.get(this.response, 'state[0].name');
    var stateAbbr = (stateName === 'Washington' ? 'WA' : 'OR');

    if (address.indexOf(stateAbbr) !== -1) {
      var currentLocation = new google.maps.LatLng(lat, lng);
      $.extend(this.response, { currentLocation: currentLocation });
      this.triggerRouteEvent('addressViewSubmit', this.response);
    } else {
      this.$loading.hide();
      this.$outOfStateModal.fadeIn()
    }
  }
});