var gulp = require('gulp');
var s3 = require('gulp-s3');
var cloudfront = require('gulp-cloudfront-invalidate');
var fs = require('fs');

awsStaging = JSON.parse(fs.readFileSync('./aws-staging.json'));
gulp.task("push-build-staging", function() {
  return gulp.src('build/**')
    .pipe(s3(awsStaging, {
      uploadPath: '/'
    }));
});

gulp.task('deploy-staging', ['push-build-staging']);

awsProduction = JSON.parse(fs.readFileSync('./aws-production.json'));
gulp.task("push-build-production", function() {
  return gulp.src('build/**')
    .pipe(s3(awsProduction, {
      uploadPath: '/'
    }));
});
 
var settings = {
  distribution: 'ECVQXYLEFP1ZL',
  paths: ['/app.js'],
  accessKeyId: awsProduction.key,
  secretAccessKey: awsProduction.secret,
  wait: true
}
 
gulp.task('invalidate-cloudfront-production', function () {
  return gulp.src('*')
    .pipe(cloudfront(settings));
});

gulp.task('deploy-production', ['push-build-production'/*, 'invalidate-cloudfront-production'*/]);