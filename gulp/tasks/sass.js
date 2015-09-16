var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var gulpSass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var handleErrors = require('../util/handleErrors');

gulp.task('sass', ['images'], function () {
  sass('src/scss/app.scss', {
    sourcemap: false
  }).pipe(
    autoprefixer({ browsers: '> 5%' })
  ).pipe(gulp.dest('build'));
});