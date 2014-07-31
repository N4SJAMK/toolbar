var express        = require('express');
var favicon        = require('serve-favicon');
var path           = require('path');
var logger         = require('morgan');
var cookieParser   = require('cookie-parser');
var bodyParser     = require('body-parser');
var debug          = require('debug')('nodeTB');
var session        = require('express-session');
var mongoose       = require('mongoose');
var expressLayouts = require('express-ejs-layouts');
var passport       = require('passport');

 
var app = express();
 
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set("view options", { layout: true });
app.set("layout extractScripts", false);
 
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public'), {maxAge: 172800000})); //cache age 48 hours
app.use(expressLayouts);

// connect to Mongo when the app initializes
mongoose.connect('mongodb://localhost/toolbar');

app.use(cookieParser());
// passport
require('./config/passport.js')(passport);
app.use(session({
    secret: '8LjNUDB2jb2JR5f8',
    saveUninitialized: true,
    resave: true,
    cookie: {maxAge: 15552000000} // 6 months
}));
app.use(passport.initialize());
app.use(passport.session());

// routes
require('./routes/index.js')(app, passport);
 
/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
 
/// error handlers
 
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
 
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
 
 
module.exports = app;
 
 
app.set('port', process.env.PORT || 3000);
 
var server = app.listen(app.get('port'), function() {
  console.log("Mode: " + app.get('env') + ". Listening port " + server.address().port);
  debug('Express server listening on port ' + server.address().port);
});