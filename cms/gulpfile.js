var gulp = require('gulp');
var webserver = require('gulp-webserver');
var compass = require('gulp-compass');
var jade = require('gulp-jade');
var s3 = require("gulp-s3");
var fs = require("fs");

awsStaging = JSON.parse(fs.readFileSync('../aws-staging.json'));
gulp.task("push-staging", function () {
  gulp.src('/')
    .pipe(s3(awsStaging));
})

gulp.task('webserver', function() {
  gulp.src('./')
    .pipe(webserver({}));
});

gulp.task('compass', function() {
  gulp.src('./compass/sass/*.scss')
    .pipe(compass({
      config_file: './compass/config.rb',
      css: './css',
      sass: './compass/sass',
      task: 'watch'
    }))
    .pipe(gulp.dest('./css'));
});

gulp.task('jade', function () {
  gulp.src('./partials/devices/*.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('./partials/devices'));

  gulp.src('./partials/directives/*.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('./partials/directives'));

  gulp.src('./partials/*.jade')
    .pipe(jade())
    .pipe(gulp.dest('./partials'));

  gulp.src('./index.jade')
    .pipe(jade())
    .pipe(gulp.dest('./'));
});

gulp.task('watch-jade', function () {
    gulp.watch(['./index.jade', './partials/**/*.jade'], ['jade'])
});

gulp.task('default', ['webserver', 'compass', 'watch-jade']);