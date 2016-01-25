var assert = require('assert');
var LocationMatcher = require('../../src/javascript/locationMatcher.js');
var data = require('../mocks/milwaukee.json');
var _ = require('lodash');

describe('Locations', function() {

  describe('matching', function () {
    var matchedLocations = LocationMatcher(data);

    // there are seven locations total, one for
    // each combination of possible types of voting locations:
    // p -> polling location
    // e -> early vote site
    // d -> dropoff location
    var p = _.find(matchedLocations, _.matchesProperty(['address', 'locationName'], "St. Robert's School"));
    var e = _.find(matchedLocations, _.matchesProperty(['address', 'locationName'], "Alterra"));
    var d = _.find(matchedLocations, _.matchesProperty(['address', 'locationName'], "UWM Bookstore"));
    var pe = _.find(matchedLocations, _.matchesProperty(['address', 'locationName'], "Hayek's"));
    var pd = _.find(matchedLocations, _.matchesProperty(['address', 'locationName'], "Schwartz"));
    var ed = _.find(matchedLocations, _.matchesProperty(['address', 'locationName'], "Jamos"));
    var ped = _.find(matchedLocations, _.matchesProperty(['address', 'locationName'], "Plymouth Church"));

    it('should a list of all locations', function () {
      assert.equal(matchedLocations.length, 7);
    });

    it('should have correct type indicators for one location', function () {
      assert.equal(p.pollingLocation, true);
      assert.equal(p.earlyVoteSite, undefined);
      assert.equal(p.dropOffLocation, undefined);

      assert.equal(e.pollingLocation, undefined);
      assert.equal(e.earlyVoteSite, true);
      assert.equal(e.dropOffLocation, undefined);

      assert.equal(d.pollingLocation, undefined);
      assert.equal(d.earlyVoteSite, undefined);
      assert.equal(d.dropOffLocation, true);
    });

    it('should have correct type indicators for multiple locations', function () {
      assert.equal(pe.pollingLocation, true);
      assert.equal(pe.earlyVoteSite, true);
      assert.equal(pe.dropOffLocation, undefined);

      assert.equal(pd.pollingLocation, true);
      assert.equal(pd.earlyVoteSite, undefined);
      assert.equal(pd.dropOffLocation, true);

      assert.equal(ed.pollingLocation, undefined);
      assert.equal(ed.earlyVoteSite, true);
      assert.equal(ed.dropOffLocation, true);

      assert.equal(ped.pollingLocation, true);
      assert.equal(ped.earlyVoteSite, true);
      assert.equal(ped.dropOffLocation, true);
    })
  });
});