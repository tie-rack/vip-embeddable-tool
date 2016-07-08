var View = require('./view.js');
var api = require('../api.js');
var $ = require('jquery');
var _ = require('lodash');
var colors = require('../colors.js');

module.exports = View.extend({

  $id          : 'address-view',

  template     : require('./templates/address-lookup.hbs'),

  multipleElections : require('./templates/partials/multiple-elections.hbs'),

  mailOnly     : require('./templates/partials/mail-only.hbs'),

  events : {
    '#plus-icon click' : 'openAboutModal',
    '#close-button click' : 'closeAboutModal',
    '#not-found-button click' : 'closeNotFoundModal',
    '#submit-address-button click' : 'submitAddress',
    '#use-current-location click' : 'useCurrentLocation',
    '#use-registered-address click' : 'useRegisteredAddress',
    '#use-different-address click' : 'useDifferentAddress',
    '#out-of-state click' : 'useRegisteredAddress',
    '#select-language change' : 'selectLanguage'
  },

  hasSubmitted: false,

  address : '',

  resizer: function () {
    // constrain container to parent width
    if (this.$container.parent().width() < this.$container.width()) {
      this.$container.width(this.$container.parent().width());
    }
  },

  onBeforeRender : function(options) {
    this.assets = options.assets;
  },

  onAfterRender : function(options) {
    this.$addressInput = this.find('#address-input');
    this.$aboutModal = this.find('#about');
    this.$notFoundModal = this.find('#address-not-found');
    this.$currentLocationModal = this.find('#current-location');
    this.$fade = this.find('#fade');
    this.$loading = this.find('.loading');
    this.$outOfStateModal = this.find('#out-of-state');
    this.$selectLanguage = this.find('#select-language');

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
    console.log(response)
    this.response = response;

    var stateName = _.get(this.response, 'state[0].name');
    if (stateName === 'Washington' || stateName === 'Oregon') {
      this.showCurrentLocationModal();
    } else if (response.mailOnly) {
      this.showMailOnlyModal();
    } else if (response.otherElections) {
      this.showMultipleElectionsModal();
    } else this.triggerRouteEvent('addressViewSubmit', response);
  },

  submitElection: function () {
    var $elections = this.$multipleElectionsModal.find('.election');
    var $selected = $elections.filter('.selected');

    this.electionId = $selected.find('.election-id').text();

    this._makeRequest({
      address: this._parseAddress(this.response.normalizedInput),
      success: function(newResponse) {
        this.triggerRouteEvent('addressViewSubmit', newResponse);
      }.bind(this)
    });
  },

  selectElection: function (event) {
    var $elections = this.$multipleElectionsModal.find('.election');

    $elections.removeClass('selected');
    $(event.currentTarget).addClass('selected');

    event.stopPropagation();
  },

  openAboutModal: function (event) {
    this.$fade.fadeTo('fast', .2);
    this.$aboutModal.fadeIn('fast');

    event.stopPropagation();
  },

  closeAboutModal: function() {
    this.$aboutModal.fadeOut('fast');
    this.$fade.fadeOut('fast');
  },

  closeNotFoundModal: function() {
    this.$notFoundModal.hide();
    this.$fade.fadeOut('fast');
  },

  containerClick: function (event) {
    var $target = $(event.target);

    if (!$target.hasClass('modal') && !$target.parents('.modal').length > 0) {
      this.$aboutModal.hide();
      this.$notFoundModal.hide();
      this.$currentLocationModal.hide();
      this.$fade.fadeOut('fast');
    }
  },

  showMultipleElectionsModal: function () {
    this.$multipleElectionsModal = $(this.multipleElections({
      data: this.response,
      assets: this.assets
    }));

    var $elections = this.$multipleElectionsModal.find('.election');
    var $select = this.$multipleElectionsModal.find('button');

    $elections.on('click', this.selectElection.bind(this));
    $select.on('click', this.submitElection.bind(this));

    this.$el.append(this.$multipleElectionsModal);

    this.$multipleElectionsModal.fadeIn();
    this.$fade.fadeTo('fast', .2);
  },

  showCurrentLocationModal: function () {
    this.$currentLocationModal.fadeIn();
    this.$fade.fadeTo('fast', .2);
    this.$loading.hide();
  },

  showMailOnlyModal: function () {
    var $mailOnly = $(this.mailOnly(this.response));

    $mailOnly.find('button').on('click', this.useRegisteredAddress.bind(this));

    this.$el.append($mailOnly);
    $mailOnly.fadeIn();

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
      }.bind(this), this.useRegisteredAddress.bind(this));
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

  selectLanguage: function () {
    var selectedLanguage = this.$selectLanguage.val();

    this.triggerRouteEvent('addressViewRerender', selectedLanguage);
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
