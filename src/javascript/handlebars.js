var handlebars = require('hbsfy/runtime');
var $ = require('jquery');
var _ = require('lodash');

module.exports = (function() {
  var json = function(context) {
    return JSON.stringify(context)
  };

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

  var locationTypes = function(location) {
    var pollingLocation = location.pollingLocation;
    var earlyVoteSite = location.earlyVoteSite;
    var dropOffLocation = location.dropOffLocation;

    if (pollingLocation && !earlyVoteSite && !dropOffLocation) {
      return "Polling Location";
    }
    if (!pollingLocation && earlyVoteSite && !dropOffLocation) {
      return "Early Vote Site";
    }
    if (!pollingLocation && !earlyVoteSite && dropOffLocation) {
      return "Drop-off Location";
    }
    if (pollingLocation && earlyVoteSite && !dropOffLocation) {
      return "Polling Location & Early Vote Site";
    }
    if (pollingLocation && !earlyVoteSite && dropOffLocation) {
      return "Polling Location & Drop-off Location";
    }
    if (!pollingLocation && earlyVoteSite && dropOffLocation) {
      return "Early Vote Site & Drop-off Location";
    }
    if (pollingLocation && earlyVoteSite && dropOffLocation) {
      return "Polling Location, Early Vote Site & Drop-off Location";
    }

    return "";
  };

  var parseAddress = function (address) {
    if (typeof address === 'object') {
      var parsedAddress = '';
      for (var key in address) parsedAddress += address[key] + ' ';
    return parsedAddress;
    } else return address;
  }

  var partyName = function (text) {
    var parties = {
      "DEM": "Democratic Party",
      "LIB": "Libertarian Party",
      "REP": "Republican Party"
    };

    return parties[text] != void 0 ? parties[text] : text;
  };

  var getUrlKeys = function (obj) {
    return _.filter(_.keys(obj), function (key) { return _.endsWith(key, 'Url') });
  };

  var hasUrlProperties = function (obj) {
    return !_.isEmpty(getUrlKeys(obj))
  };

  var createInfoLink = function (urlObj, titleObj, key) {
    return "<a href=\"" + _.get(urlObj, key) + "\" target=\"_blank\">" + _.get(titleObj, key, _.get(urlObj, key)) + "</a><br><br>";
  };

  var addressLine = function (name, obj, key1, key2) {
    var str = "";

    if (!_.isEmpty(_.get(obj, key1))) {
      str += "<div class=\"address-line\">" +
        (name ? "<small>" + name + ":</small> " : "") +
        _.get(obj, key1) +
        (_.has(obj, key2) ? " - " + _.get(obj, key2) : "") +
        "</div>";
    }

    return str;
  };

  var electionResourceLinks = function (assets, data) {
    var localHeader = _.get(assets, 'text.resources.electionAdministration.local_jurisdiction');
    var stateHeader = _.get(assets, 'text.resources.electionAdministration.stateElectionsOffice');
    var local = _.get(data, 'state[0].local_jurisdiction.electionAdministrationBody');
    var state = _.get(data, 'state[0].electionAdministrationBody');
    var linkTitles = _.get(assets, 'text.resources.moreResources');
    var str = "";

    if (hasUrlProperties(local)) {
      var localLinks = _.partial(createInfoLink, local, linkTitles);

      str += "<div id=\"local-jurisdiction-title\"><h1>" + localHeader + "</h1>";
      str += _.reduce(_.map(getUrlKeys(local), localLinks), _.add);
      str += "</div>";
    }

    if (hasUrlProperties(state)) {
      var stateLinks = _.partial(createInfoLink, state, linkTitles);

      str += "<div id=\"state-elections-office\"><h1>" + stateHeader + "</h1>";
      str += _.reduce(_.map(getUrlKeys(state), stateLinks), _.add);
      str += "</div>";
    }

    return str;
  };

  var localJurisdictionName = function (data) {
    var ljName = _.get(data, 'state[0].local_jurisdiction.name');
    var ljEABName = _.get(data, 'state[0].local_jurisdiction.electionAdministrationBody.name');

    var ljNameTag = "<span id=\local-jurisdiction-name\"><b>" + _.toString(ljName) + "</b></span><br>";
    var ljEABNameTag = "<span id=\local-jurisdiction-eab-name\"><b>" + _.toString(ljEABName) + "</b></span><br>"

    if (_.isUndefined(ljName) && _.isUndefined(ljEABName)) {
      return ""
    }
    if (ljName == ljEABName) {
      return ljNameTag
    }
    if (_.includes(ljName, ljEABName)) {
      return ljNameTag
    }
    if (_.includes(ljEABName, ljName)) {
      return ljEABNameTag
    }

    return ljNameTag + ljEABNameTag
  };

  var electionAdministrationBodyAddresses = function (assets, eab) {
    // per request we are only returning the physical address from the API
    // for now. otherwise we will match the correspondence and physical
    // addresses to remove duplicates or contained addresses, and if they
    // are unique display both with their separate labels

    var addressPartial = handlebars.partials['normalized-address'];
    if (typeof addressPartial !== 'function') {
      addressPartial = handlebars.compile(addressPartial);
    }

    // var correspondenceAddress = _.get(eab, 'correspondenceAddress');
    var physicalAddress = _.get(eab, 'physicalAddress');

    // var correspondenceAddressStr = _.reduce(_.values(correspondenceAddress), _.add);
    var physicalAddressStr = _.reduce(_.values(physicalAddress), _.add);

    // var correspondenceAddressTitle = _.get(assets, 'text.resources.electionAdministration.correspondenceAddress');
    // var physicalAddressTitle = _.get(assets, 'text.resources.electionAdministration.physicalAddress');

    var physicalAddressTag = "<div class=\"election-administration-address\">" + addressPartial(physicalAddress) + "</div>";
    // var correspondenceAddressTag = "<div class=\"election-administration-address\">" + addressPartial(correspondenceAddress) + "</div>";

    // var physicalAddressTagWithTitle = "<div class=\"election-administration-address\"><span>" +
    //   physicalAddressTitle + ": </span>" + addressPartial(physicalAddress) + "</div>";

    // var correspondenceAddressTagWithTitle = "<div class=\"election-administration-address\"><span>" +
    //   correspondenceAddressTitle + ": </span>" + addressPartial(correspondenceAddress) + "</div>";

    // per request eliminate addresses that only have state initials
    // and nothing else
    if (physicalAddressStr == void 0 || physicalAddressStr.length <= 2) {
      return ""
    }

    return physicalAddressTag

    // if (correspondenceAddressStr == physicalAddressStr) {
    //   return physicalAddressTag
    // }
    // if (_.includes(correspondenceAddressStr, physicalAddressStr) ||
    //     _.isEmpty(physicalAddressStr) && !_.isEmpty(correspondenceAddressStr)) {
    //   return correspondenceAddressTag
    // }
    // if (_.includes(physicalAddressStr, correspondenceAddressStr) ||
    //     _.isEmpty(correspondenceAddressStr) && !_.isEmpty(physicalAddressStr)) {
    //   return physicalAddressTag
    // }
    // if (!_.isEmpty(correspondenceAddressStr) && !_.isEmpty(physicalAddressStr)) {
    //   return physicalAddressTagWithTitle + correspondenceAddressTagWithTitle
    // }

    // return ""
  };

  var locationLegend = function(data) {

    if (_.isEmpty(data.locations)) {
      return "";
    }

    var pollingLocations = !_.isUndefined(_.find(data.locations, function(l) {
      return l.pollingLocation && !l.earlyVoteSite && !l.dropOffLocation
    }));
    var earlyVoteSites = !_.isUndefined(_.find(data.locations, function(l) {
      return !l.pollingLocation && l.earlyVoteSite && !l.dropOffLocation
    }));
    var dropOffLocations = !_.isUndefined(_.find(data.locations, function(l) {
      return !l.pollingLocations && !l.earlyVoteSites && l.dropOffLocation
    }))
    var multiSitesPLEV = !_.isUndefined(_.find(data.locations, function(l) {
      return l.pollingLocation && l.earlyVoteSite && !l.dropOffLocation
    }));
    var multiSitesPLDO = !_.isUndefined(_.find(data.locations, function(l) {
      return l.pollingLocation && !l.earlyVoteSite && l.dropOffLocation
    }));
    var multiSitesEVDO = !_.isUndefined(_.find(data.locations, function(l) {
      return !l.pollingLocation && l.earlyVoteSite && l.dropOffLocation
    }));
    var multiSitesPLEVDO = !_.isUndefined(_.find(data.locations, function(l) {
      return l.pollingLocation && l.earlyVoteSite && l.dropOffLocation
    }));


    var str =
      '<div id="location-legend" class="box right">' +
        '<div id="location-legend-close"><img src="' + image('grey-plus.png') + '"></div>';

    if (pollingLocations) {
      str += '<div class="legend-row"><div id="blue-block" class="blue"></div><span id="blue-label" class="blue">Polling Location</span></div>';
    }
    if (earlyVoteSites) {
      str += '<div class="legend-row"><div id="red-block" class="red"></div><span id="red-label" class="red">Early Voting Site</span></div>';
    }
    if (dropOffLocations) {
      str += '<div class="legend-row"><div id="grey-block" class="grey"></div><span id="grey-label" class="grey">Dropoff Location</span></div>';
    }
    if (multiSitesPLEV || multiSitesPLDO || multiSitesEVDO || multiSitesPLEVDO) {
      var multiSiteBegin = '<div class="legend-row"><div id="green-block" class="green"></div><span id="green-label" class="green">';
      var multiSiteEnd = '</span></div>';

      str += multiSiteBegin;

      if (_.toInteger(multiSitesPLEV) + _.toInteger(multiSitesPLDO) + _.toInteger(multiSitesEVDO) + _.toInteger(multiSitesPLEVDO) > 1) {
        str += 'Multiple Location Types';
      } else if (multiSitesPLEVDO) {
        str += 'Polling Location, Early Vote Site, & Dropoff Location';
      } else if (multiSitesPLEV) {
        str += 'Polling Location & Early Vote Site';
      } else if (multiSitesPLDO) {
        str += 'Polling Location & Dropoff Location';
      } else if (multiSitesEVDO) {
        str += 'Early Vote Site & Dropoff Location';
      }

      str += multiSiteEnd;
    }

    str += '</div>';

    return str;
  }

  return {
    registerHelpers: function() {
      handlebars.registerHelper('json', json);
      handlebars.registerHelper('escapeHTML', escapeHTML);
      handlebars.registerHelper('either', either);
      handlebars.registerHelper('log', log);
      handlebars.registerHelper('asset', asset);
      handlebars.registerHelper('image', image);
      handlebars.registerHelper('partyName', partyName);
      handlebars.registerHelper('addressLine', addressLine);
      handlebars.registerHelper('locationTypes', locationTypes);
      handlebars.registerHelper('locationLegend', locationLegend);
      handlebars.registerHelper('parseAddress', parseAddress);
      handlebars.registerHelper('electionResourceLinks', electionResourceLinks);
      handlebars.registerHelper('localJurisdictionName', localJurisdictionName);
      handlebars.registerHelper('electionAdministrationBodyAddresses', electionAdministrationBodyAddresses);
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

      handlebars.registerPartial(
        'location',
        require('./views/templates/partials/location.hbs')
      );

      handlebars.registerPartial(
        'mail-only',
        require('./views/templates/partials/mail-only.hbs')
      );
    }
  }
})(this);