"use strict";

var _ = require('lodash');

var stringReplacePattern = /\./g;

module.exports = function(data) {
  var pollingLocations = data.pollingLocations || [];
  var earlyVoteSites = data.earlyVoteSites || [];
  var dropOffLocations = data.dropOffLocations || [];

  // set property identifiers on each so the view templates
  // can identify type
  pollingLocations = _.map(pollingLocations, function (pollingLocation) {
    return _.assignIn(pollingLocation, { pollingLocation: true })
  });

  earlyVoteSites = _.map(earlyVoteSites, function (earlyVoteSites) {
    return _.assignIn(earlyVoteSites, { earlyVoteSite: true })
  });

  dropOffLocations = _.map(dropOffLocations, function (dropOffLocation) {
    return _.assignIn(dropOffLocation, { dropOffLocation: true })
  });

  // partition other types of locations into two arrays --
  // the first ones are also polling locations, and
  // the second are unique sites of that location type
  var partitionedEVSites = _.partition(earlyVoteSites,
    matchingAddressInList.bind(null, pollingLocations)
  );

  var partitionedDOLocations = _.partition(dropOffLocations,
    matchingAddressInList.bind(null, pollingLocations)
  );

  var duplicateEVSites = _.first(partitionedEVSites);
  var uniqueEVSites = _.last(partitionedEVSites);

  var duplicateDOLocations = _.first(partitionedDOLocations);

  // partition dropoff locations that are not also polling
  // locations -- the first ones are also early vote sites,
  // the second are unique dropoff locations
  var partitionedEVDOSites = _.partition(_.last(partitionedDOLocations),
    matchingAddressInList.bind(null, earlyVoteSites)
  );

  var duplicateEVDOSites = _.first(partitionedEVDOSites);
  var uniqueDOLocations = _.last(partitionedEVDOSites);

  // set the correct type indicators on duplicate early voting
  // sites and dropoff locations on their corresponding polling
  // location objects
  var pe = _.map(duplicateEVSites, getMatchingLocationInList.bind(null, pollingLocations));
  _.forEach(pe, function (location) {
    var dl = getMatchingLocationInList(duplicateEVSites, location);

    location.earlyVoteSite = true;
    location.earlyVoteSiteNotes = dl.notes;
    location.earlyVoteSitePollingHours = dl.pollingHours;
    location.earlyVoteSiteStartDate = dl.startDate;
    location.earlyVoteSiteEndDate = dl.endDate;
    location.earlyVoteSiteVoterServices = dl.voterServices;
  });

  var pd = _.map(duplicateDOLocations, getMatchingLocationInList.bind(null, pollingLocations));
  _.forEach(pd, function (location) {
    var dl = getMatchingLocationInList(duplicateDOLocations, location);

    location.dropOffLocation = true;
    location.dropOffLocationNotes = dl.notes;
    location.dropOffLocationPollingHours = dl.pollingHours;
    location.dropOffLocationStartDate = dl.startDate;
    location.dropOffLocationEndDate = dl.endDate;
    location.dropOffLocationVoterServices = dl.voterServices;
  });



  var ed = _.map(duplicateEVDOSites, getMatchingLocationInList.bind(null, earlyVoteSites));
  _.forEach(ed, function (location) {
    var dl = getMatchingLocationInList(duplicateEVDOSites, location);

    location.dropOffLocation = true;
    location.dropOffLocationNotes = dl.notes;
    location.dropOffLocationPollingHours = dl.pollingHours;
    location.dropOffLocationStartDate = dl.startDate;
    location.dropOffLocationEndDate = dl.endDate;
    location.dropOffLocationVoterServices = dl.voterServices;
  });

  // return the collection of unique location types and
  // augmented duplicates
  return _.concat(pollingLocations, uniqueEVSites, uniqueDOLocations)
};

function getMatchingLocationInList (list, location) {
  return _.find(list, addressesMatch.bind(null, location));
}

function matchingAddressInList (list, location) {
  return _.some(list, addressesMatch.bind(null, location));
}

function addressesMatch (loc1, loc2) {
  return (
    compareString(loc1.address.line1, loc2.address.line1) &&
    compareString(loc1.address.line2, loc2.address.line2) &&
    compareString(loc1.address.line3, loc2.address.line3)
  )
}

function compareString (str1, str2) {
  return adaptString(str1) == adaptString(str2)
}

function adaptString (str) {
  return !!str && str.replace(stringReplacePattern, '').toLowerCase()
}