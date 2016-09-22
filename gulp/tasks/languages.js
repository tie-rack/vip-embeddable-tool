var gulp = require('gulp');

gulp.task('languages', function() {
  return gulp.src('src/javascript/languages')
    .pipe(gulp.dest('build'));
});
