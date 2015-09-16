var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var prefix = require('gulp-autoprefixer');
var handleErrors = require('../util/handleErrors');

// WARNING: uses gulp-ruby-sass (not gulp-sass)
// gulp.task('sass', ['images'], function () {
//   sass('src/scss/app.scss', {
//     sourcemap: false
//   }).pipe(
//     prefix({ browsers: '> 5%' })
//   ).pipe(gulp.dest('build'));
// });

gulp.task('sass', ['images'], function () {
  gulp.src('src/scss/app.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(prefix({ browsers: '> 5%' }))
    .pipe(gulp.dest('build'));
});
