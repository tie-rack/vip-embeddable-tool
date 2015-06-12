var gulp = require('gulp');
var s3 = require("gulp-s3");
var fs = require("fs");

awsStaging = JSON.parse(fs.readFileSync('../aws-staging.json'));
gulp.task("push-staging", function () {
  gulp.src('./**')
    .pipe(s3(awsStaging));
})