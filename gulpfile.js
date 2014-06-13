var gulp = require('gulp')
var source = require('vinyl-source-stream')
var watchify = require('watchify')
var reload = require("gulp-livereload");
var stylus = require("gulp-stylus");
var gutil = require("gulp-util");
var notifier = require("terminal-notifier");



var notify = function(title){
  return function(){
    notifier(title, {title: title});
  };
};

var notifyError = function(title){
  return function(err){
    gutil.beep();
    gutil.log(gutil.colors.red(err));
    notifier(err.message, {title: title});
  };
};


gulp.task('style', function () {
  gulp.src('./style/index.styl')
    .pipe(stylus())
    .pipe(gulp.dest('./compiled'))
    .pipe(reload())
    .on("data", notify("CSS Built"));;
});


gulp.task('javascript', function() {
  var bundler = watchify({extensions: [".coffee", ".litcoffee"]});
  bundler.transform("coffeeify");
  bundler.add("./src/index.coffee");

  bundler.on('update', rebundle)

  function rebundle () {
    return bundler.bundle()
      .on("error", notifyError("Javascript Error"))
      .pipe(source('index.js'))
      .pipe(gulp.dest('./compiled'))
      .pipe(reload())
      .on("data", notify("Javascript Built"));
  }

  return rebundle();
});


gulp.task("watch", ["javascript"], function () {
  gulp.watch(["./style/**/*.styl"], ["style"])
});

gulp.task("default", ["watch"]);