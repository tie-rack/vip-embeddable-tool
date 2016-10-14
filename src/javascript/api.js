var $ = require('jquery');

module.exports = function(options) {
  var url = 'https://www.googleapis.com/civicinfo/v2/voterinfo?';

  if (options.key) url += 'key=' + options.key;
  if (options.address) url += '&address=' + options.address;
  if (options.test) url += '&electionId=2000';

  if (!window._vitUsesStagingData) {
    if (options.electionId) {
      url += '&electionId=' + options.electionId;
    } else {
      url += '&electionId=5000';
    }
    if (options.officialOnly) url += '&officialOnly=' + options.officialOnly;
    if (typeof options.productionDataOnly !== 'undefined')
      url += '&productionDataOnly=' + options.productionDataOnly;
  } else {
    var form = $('#vit-staging-data-form');

    var electionId = form.find('#election-id').val();
    var officialOnly = form.find('#official-only').is(':checked');
    var stagingData = form.find('#staging-data').is(':checked');

    // check in case the user left the option blank
    if (options.electionId) {
      url += '&electionId=' + options.electionId;
    } else if (electionId) {
      url += '&electionId=' + electionId;
    }

    url += '&officialOnly=' + officialOnly;
    if (stagingData) {
      url += '&productionDataOnly=false';
    }
  }

  console.log(url)

  $.support.cors = true;
  $.ajax({
    url: url,
    dataType: 'jsonp',
    cache: false,
    error: function(e) {
      options.error && options.error();
    },
    success: function(response) {
      if (typeof response.error === 'undefined')
        options.success(response);
      else options.error && options.error();
    }
  });
}