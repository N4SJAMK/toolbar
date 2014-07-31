var gulp          = require('gulp'),
    jshint        = require('gulp-jshint'),
    uglify        = require('gulp-uglify'),
    livereload    = require('gulp-livereload'),
    mocha         = require('gulp-mocha'),
    gutil         = require('gulp-util'),
    sass          = require('gulp-sass'),
    concat        = require('gulp-concat'),
    rimraf        = require('gulp-rimraf'),
    runSequence   = require('run-sequence'),
    minifyCSS     = require('gulp-minify-css');

// exclude node modules and imported libraries
var scriptPaths = ['**/*.js', 
                   '!./node_modules/**', 
                   '!./public/javascripts/**', 
                   '!./test/**', 
                   '!./script_dev/javascripts/external_lib/**/*.js', 
                   '!./script_dev/javascripts/mocha.js',
                   '!./script_dev/all.js' ];

// define include order for javascript files
var concatOrder = ['./script_dev/javascripts/external_lib/jquery.js',
                   './script_dev/javascripts/external_lib/jQueryRotate.js',
                   './script_dev/javascripts/external_lib/jquery-ui.js',
                   '!./script_dev/javascripts/external_lib/he.js',          // concat separately as compressing breaks it on IE
                   './script_dev/javascripts/layout.js',
                   './script_dev/javascripts/models/bar.js',
                   './script_dev/javascripts/globals.js',
                   './script_dev/javascripts/models/tab.js',
                   './script_dev/javascripts/models/box.js',
                   './script_dev/**/*.js']; // all the rest in whatever order

// scss to css and compress scripts
gulp.task('publish', function() {
  runSequence('sass','css:minify','scripts:publish');
});

// Puts all js to one file, compresses it, cleans up
gulp.task('scripts:publish', function() {
  runSequence('clean:pub:alljs','clean:dev:alljs', 'concat', 'compress', 'he:append', function() {
    return gulp.start('clean:dev:alljs');
  });
});

// default task. In brackets it's possible to declare tasks that need to be ran before the rest
gulp.task('default', ['scripts'] , function() {
  return gulp.start('mocha'); 
});

// minifies css from script_dev and moves them to public folder
gulp.task('css:minify', function() {
  gulp.src('./script_dev/styles/*.css')
    .pipe(minifyCSS())
    .pipe(gulp.dest('./public/stylesheets'))
});

// clean all.js
gulp.task('clean:pub:alljs', function() {
  return gulp.src('./public/javascripts/all.js', {read: false})
    .pipe(rimraf({force: true}));
});

// clean all.js
gulp.task('clean:dev:alljs', function() {
  return gulp.src(['./script_dev/all.js','./public/javascripts/all_tmp/'], {read: false})
    .pipe(rimraf({force: true}));
});

// sass to css, then minify all css, put them to public
gulp.task('css:publish', function() {
  runSequence('sass', 'css:minify');
});

// convert sassy css to css
gulp.task('sass', function() {
  return gulp.src('./script_dev/styles/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./script_dev/styles'));
});

// moves he.js to tmp/javascripts/external_lib
gulp.task('he:append', function() {
  return gulp.src(['./script_dev/javascripts/external_lib/he.js', 'public/javascripts/all_tmp/all.js'])
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./public/javascripts'));
});

// put all js into one file
gulp.task('concat', function() {
  return gulp.src(concatOrder)
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./script_dev/'));
});

// Lint for javascripts
gulp.task('scripts', function() {
  return gulp.src(scriptPaths)
         .pipe(jshint('.jshintrc'))
         .pipe(jshint.reporter('jshint-junit-reporter'));
});

// uglify 
gulp.task('compress', function() {
  return gulp.src(['./script_dev/all.js'])
      .pipe(uglify())
      .pipe(gulp.dest('./public/javascripts/all_tmp'));
});

// mocha tests
gulp.task('mocha', function() {
  return gulp.src('./test/*.js')
  .pipe(mocha({reporter: 'mocha-jenkins-reporter'}))
  .on('error', gutil.log);
});

// Watch for scss to css convertion. Triggers css:publish everytime file has changed
gulp.task('css:watch', function() {
  gulp.watch(['./script_dev/styles/*', '!./script_dev/styles/style.css'], ['css:publish']);
  var server = livereload();
  gulp.watch(['./script_dev/styles/*', '!./script_dev/styles/style.css']).on('change', function(file) {
    server.changed(file.path);
  });
});

// Watch and compress client side code
gulp.task('watch', function() {
  // watch .js files
  gulp.watch(['./script_dev/**', '!./script_dev/javascripts/external_lib'], ['scripts', 'scripts:publish']);

  var server = livereload();
  gulp.watch(['./script_dev/**', '!./script_dev/javascripts/external_lib']).on('change', function(file) {
    server.changed(file.path);
  });
});
