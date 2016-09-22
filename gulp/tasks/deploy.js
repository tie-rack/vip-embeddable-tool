var gulp = require('gulp');
var s3 = require('gulp-s3');
var fs = require('fs');

awsStaging = JSON.parse(fs.readFileSync('./aws-staging.json'));
gulp.task("push-build-staging", function() {
  return gulp.src('build/**')
    .pipe(s3(awsStaging, {
      uploadPath: '/'
    }));
});

// gulp.task('push-languages-staging', function() {
//   return gulp.src('src/javascript/languages/*')
//     .pipe(s3(awsStaging, {
//       uploadPath: '/languages/'
//     }));
// });

gulp.task('deploy-staging', ['push-build-staging'/*, 'push-languages-staging'*/]);

awsProduction = JSON.parse(fs.readFileSync('./aws-production.json'));
gulp.task("push-build-production", function() {
  return gulp.src('build/**')
    .pipe(s3(awsProduction, {
      uploadPath: '/'
    }));
});

// gulp.task('push-languages-production', function() {
//   return gulp.src('src/javascript/languages/*')
//     .pipe(s3(awsProduction, {
//       uploadPath: '/languages/'
//     }));
// });

gulp.task('deploy-production', ['push-build-production'/*, 'push-languages-production'*/]);