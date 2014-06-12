var gulp = require('gulp')
var source = require('vinyl-source-stream')
var watchify = require('watchify')
var reload = require("gulp-livereload");
var stylus = require("gulp-stylus")


gulp.task('style', function () {
  gulp.src('./style/index.styl')
    .pipe(stylus())
    .pipe(gulp.dest('./compiled'))
    .pipe(reload());
});


gulp.task('javascript', function() {
  var bundler = watchify({extensions: [".coffee", ".litcoffee"]});
  bundler.transform("coffeeify");
  bundler.add("./src/index.coffee");

  bundler.on('update', rebundle)

  function rebundle () {
    return bundler.bundle()
      .pipe(source('index.js'))
      .pipe(gulp.dest('./compiled'))
      .pipe(reload());
  }

  return rebundle();
});


gulp.task("watch", ["javascript"], function () {
  gulp.watch(["./style/**/*.styl"], ["style"])
});

gulp.task("default", ["watch"]);