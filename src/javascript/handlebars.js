var handlebars = require('hbsfy/runtime');
var $ = require('jquery')

module.exports = (function() {
  var json = function(context) { return JSON.stringify(context) };

  var escapeHTML = function(encoded) {
    var unencoded = $('<textarea />').html(encoded).val();
    var inputText = unencoded.replace(/(?:\r\n|\r|\n)/g, '<br />');

    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    // http, https, etc.
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    // www, etc.
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="https://$2" target="_blank">$2</a>');

    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
  };

  var either = function(a, b) {
    return a != void 0 && a.length > 0 ? a : b;
  };

  var log = function(text) {
    window.console && console.log(text)
  };

  var asset = function(path) {
    var url = "https://tool.votinginfoproject.org/";

    return url + path;
  };

  var image = function(filename) {
    return asset("images/" + filename);
  };

  return {
    registerHelpers: function() {
      handlebars.registerHelper('json', json);
      handlebars.registerHelper('escapeHTML', escapeHTML);
      handlebars.registerHelper('either', either);
      handlebars.registerHelper('log', log);
      handlebars.registerHelper('asset', asset);
      handlebars.registerHelper('image', image);
    },

    registerPartials: function() {
      handlebars.registerPartial(
        'election',
        require('./views/templates/partials/election.hbs')
      );

      handlebars.registerPartial(
        'election-information-item',
        require('./views/templates/partials/election-information-item.hbs')
      );

      handlebars.registerPartial(
        'election-administration-body',
        require('./views/templates/partials/election-administration-body.hbs')
      );

      handlebars.registerPartial(
        'normalized-address',
        require('./views/templates/partials/normalized-address.hbs')
      );

      handlebars.registerPartial(
        'election-official',
        require('./views/templates/partials/election-official.hbs')
      );

      handlebars.registerPartial(
        'source',
        require('./views/templates/partials/source.hbs')
      );

      handlebars.registerPartial(
        'contest',
        require('./views/templates/partials/contest.hbs')
      );

      handlebars.registerPartial(
        'modals',
        require('./views/templates/partials/modals.hbs')
      );

      handlebars.registerPartial(
        'address',
        require('./views/templates/partials/address.hbs')
      );

      handlebars.registerPartial(
        'polling-location-info',
        require('./views/templates/partials/polling-location-info.hbs')
      );
    }
  }
})(this);