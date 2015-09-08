module.exports = (function() {
  var data, addressView = require('./views/addressView.js'),
    mapView = require('./views/mapView.js'),
    apiRequest = require('./api.js'),
    text = require('./config.js'),
    $ = require('jquery'),
    xdr = require('jquery-xdr').load($),
    mock = require('../../spec/mocks/milwaukee.json')

  return {
    start: function(config) {
      var router = this;

      var options = {
        modal: true,
        officialOnly: true,
        alert: null,
        test: false,
        key: 'AIzaSyCLNlhlWcKcozqYRq9M1_j25GLUzqrJxH8',
        title: 'Voting Information Project',
        subtitle: '',
        logo: 'http://tool.votinginfoproject.org/images/voting-information-project.png',
        smallLogo: 'http://tool.votinginfoproject.org/images/vip-logo.png',
        language: 'en',
        width: 640,
        height: 480,
        productionDataOnly: true,
        assets: text
      };

      $.extend(options, config);
      $.extend(options, {
        root: ''
      });

      if (options.productionOnly === false) options.productionDataOnly = options.productionOnly;

      addressView
        .onRouteEvent('addressViewSubmit', function(response) {
          //
          // uncomment to replace data with mock stub for testing...
          // data = mock;
          //
          data = response;

          window.history && history.pushState && history.pushState(null, null, '?polling-location');

          $(window).on('popstate', function() {
            router.navigate(addressView, mapView, options);
            $('#_vitModal').hide();
          }.bind(this));

          $.extend(options, {
            data: data
          });

          router.navigate(mapView, addressView, options);
        })
        .onRouteEvent('addressViewRerender', function() {

          router.navigate(addressView, addressView, options);

        });

      mapView
        .onRouteEvent('mapViewBack', function() {
          // if the user chose the election, reroute to the election choice view
          // else go back to the address entry view
          router.navigate(addressView, mapView, options);
        })
        .onRouteEvent('mapViewRerender', function() {
          $.extend(options, {
            data: data
          })
          router.navigate(mapView, mapView, options)
        })
        .onRouteEvent('mapViewSubmit', function(response) {
          data = response;

          $.extend(options, {
            data: data
          })
          router.navigate(mapView, mapView, options);
        });

      // path to the voter ID information updated CSV file
      var voterIdInfoUrl = location.protocol.toString() + '//s3.amazonaws.com/vip-voter-information-tool/voter-id/voterIdInfo.csv';

      // default language unless specified in configs
      var language = navigator.language || navigator.browserLanguage;

      // change language
      if ((options.language && options.language !== 'en') || !language.match(/en/) || options.json) {
        var language = options.language || language;
        var supportedLanguages = [
          'en',
          'es',
          'hi',
          'ja',
          'ko',
          'th',
          'tl-PH',
          'vi',
          'zh',
          'km'
        ];

        // unsupported language
        if (supportedLanguages.indexOf(language) === -1) addressView.render(options);

        // path for the supported language translation copy
        var url = location.protocol.toString() + '//s3.amazonaws.com/vip-voter-information-tool/languages/' + language + '-config.json';

        if (options.json) {
          // render with custom JSON text
          $.extend(options, {
            assets: JSON.parse(options.json)
          });
          addressView.render(options);
        } else {
          // grab the translated copy and render with the new text
          $.ajax({
            url: url,
            cache: false,
            success: function(newText) {
              $.extend(options, {
                assets: JSON.parse(newText)
              });
              addressView.render(options);
            }
          });
        }

      } else addressView.render(options);
    },

    // helper function for navigation
    navigate: function(toView, fromView, options) {
      $.extend(options, {
        root: ''
      });
      fromView.remove();
      toView.render(options);
    }
  }
})();