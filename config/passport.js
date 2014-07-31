var LocalStrategy   = require('passport-local').Strategy;
var User = require('../models/user.js');

module.exports = function(passport) {

    // passport session setup

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    //////////////////////
    // LOCAL REGISTER
    passport.use('local-register', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        process.nextTick(function() {
		// find a user whose email is the same as the forms email
        User.findOne({ 'email' :  email }, function(err, user) {

            if (err) {
                return done(err);
            }

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false);
            } else {
				// if there is no user with that email
                // create the user
                var newUser = new User();
                newUser.email    = email;
                newUser.password = newUser.generateHash(password);

				// save the user
                newUser.save(function(err) {
                    if (err) {
                        throw err;
                    }
                    return done(null, newUser);
                });
            }

        });    

        });

    }));
    
    //////////////////////
    // LOCAL LOGIN
    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err) {
                return done(err);
            }
                
            // if no user is found
            if (!user) {
                return done(null, false);
            }

            // if the user is found but the password is wrong
            if (!user.validPassword(password)) {
                return done(null, false);
            }

            // all is well, return successful user
            return done(null, user);
        });

    }));

};
