/* browserify task
   ---------------
   Bundle javascripty things with browserify!

   If the watch task is running, this uses watchify instead
   of browserify for faster bundling using caching.
*/

var browserify   = require('browserify');
var watchify     = require('watchify');
var bundleLogger = require('../util/bundleLogger');
var gulp         = require('gulp');
// var mocha     = require('gulp-mocha');
var handleErrors = require('../util/handleErrors');
var source       = require('vinyl-source-stream');
var uglify       = require('gulp-uglify');
var streamify    = require('gulp-streamify');
var wrap         = require('gulp-wrap');

gulp.task('browserify', function() {

  var b = browserify('./src/javascript/app.js', {
    extensions: ['.js', '.hbs'],
    debug: true,

    // these are required by watchify:
    cache: {},
    packageCache: {}
  });

  var w = watchify(b);

  var bundle = function() {
    bundleLogger.start();

    return w
      .bundle()
      .on('error', handleErrors)
      .pipe(source('app.js'))
      .pipe(wrap('(function() { var define=void 0; <%= contents %> })(this);'))
      .pipe(streamify(uglify()))
      .pipe(gulp.dest('./build/'))
      .on('end', bundleLogger.end)
      .on('data', function() {})
  };

  if(global.isWatching) {
    w.on('update', bundle);
  }

  return bundle();
});
