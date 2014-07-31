var express    = require('express');
var crypto     = require('crypto');
var fs         = require('fs');
var he         = require('he');                // jshint ignore:line
var nodemailer = require('nodemailer');
var gmail      = require('../config/gmail.js') // account details for retrieving password
var mongoose   = require('mongoose');
var Bar        = require('../models/bar.js');
var Tab        = require('../models/tab.js');
var Box        = require('../models/box.js');
var User       = require('../models/user.js');

module.exports = function(app, passport) {

// checks if user (email) is on toolbar editorslist. 
// If found, callback has true as first argument
// bar  : toolbar JSON object
// user : email of the user wanted
function checkEditor(bar, user, cb) {
	if (user !== null) {
		User.findOne({email: user}, function(err, usr) {
			if ( bar.editors.indexOf(usr.id) === -1 ) {
				cb(false);
			} else {
				cb(true);
			}
		});
	} else {
		cb(false);
	}

}

// reads all icons
// callback has icons as an array as first argument
// cb(icons)
function getIcons(cb) {

	//search all icons
	var icons = fs.readdirSync('./public/images/icons');
	
	//cut file extension (.png)
	for (var i=0; i < icons.length; i++) {
		icons[i] = icons[i].slice(0, -4);
	}

	cb(icons);
}

// sends exampletab with some prefilled fields
function sendExampleTab(user, res, showTutorial,icons) {
	var tmpBar = new Bar();
	tmpBar.title = "Title";
	tmpBar.tabs.push(new Tab({
		title: "Tab title", iconID: "ic_star", boxes: [new Box({
			info:"Info about your link", content: "toolbar.n4sjamk.org", description:"Your link"})] } ));

	if (!icons) { // if icons not given as parameter
		getIcons(function(icons) {
			res.render('create', {user: user, icons: icons, bar: tmpBar, barId: null, tutorial: showTutorial});
		});
	} else {
		res.render('create', {user: user, icons: icons, bar: tmpBar, barId: null, tutorial: showTutorial});
	}
	
}

//return user's email if logged in
function checkAuth(req) {
	if (req.user) {
		return req.user.email;
	} else {
		return null;
  	}
}

//return true if email is valid
function checkEmail(email) {
	var patt_email = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

	if (patt_email.test(email)) {
		return true;
	} else {
		return false;
	}
}

//strip html tags from string
function stripTags(str) {
	return str.replace(/<(?:.|\n)*?>/gm, '');
}


/**************
    ROUTES
**************/


// Get home page
app.get('/', function(req, res) {    
	res.render('start', {layout: false, user: checkAuth(req)});
});


// Get user's profile page
app.get('/profile', function(req, res) {

	var user = checkAuth(req);

	if (user === null) {
		res.status(403).send('403 Forbidden');
	} else {
		res.render('profile', {user: user, msg: ""});
	}

});


// Get user's bars page
app.get('/bars', function(req, res) {

	var user = checkAuth(req);

	if (user === null) {
		res.status(403).send('403 Forbidden');
	} else {
		User.findOne({ email: user }, function(err, doc) {

			if (doc !== null) {

				//find bars with id's
				Bar.find({ '_id': { $in: doc.bars}}, function(err, bars) {
					res.render('bars', {user: user, bars: bars});
				});

			} else {
				res.status(403).send('403 Forbidden');
			}
		});
	}

});


app.get('/edit', function(req, res) {
	//check if user is visiting the site for first time to show tutorial
	var showTutorial = false;
	if (!req.cookies.tutorial) {
		showTutorial = true;
		res.cookie('tutorial', 1, {maxAge: 15552000000}); // 6 months
	}

	sendExampleTab(checkAuth(req), res, showTutorial);
});


// Edit bar page
app.post('/edit', function(req, res) {

	//check if user is visiting the site for first time to show tutorial
	var showTutorial = false;
	if (!req.cookies.tutorial) {
		showTutorial = true;
		res.cookie('tutorial', 1, {maxAge: 15552000000}); // 6 months
	}

	//search all icons
	var icons = fs.readdirSync('./public/images/icons');
	
	//cut file extension (.png)
	for (var i=0; i < icons.length; i++) {
		icons[i] = icons[i].slice(0, -4);
	}

	var user = checkAuth(req);

	if (req.body.id === undefined) {
		sendExampleTab(user, res, showTutorial, icons);
	} else {

		Bar.findOne({ '_id': req.body.id}, function(err, bar) {
			if (bar === null) {
				res.status(401).send("400 Bad request");
			}

            // checks if user can edit
            checkEditor(bar, user, function(found) {
            	if (found) {
            		res.render('create', {user: user, icons: icons, bar: bar, barId: bar.hash, tutorial: showTutorial});
            	}
            	else {
            		res.status(403).send("403 Forbidden");
            	}
            });
			
		});
	}

});


app.post('/delete', function(req, res) {
	Bar.findOne({ '_id': req.body.id}, function(err, bar) {
		//check that user is in editors list
		var editor = false;
		if (checkAuth(req) !== null) {
			bar.editors.forEach(function(u) {
				if (u === req.user.id) { editor = true; }
			});
		}

		if (editor === true) {
			bar.remove(function(err) {
				res.redirect('/bars');
			});
		} else {
			res.status(403).send("403 Forbidden");
		}

	});
});

app.post('/barAuth', function(req, res) {

	Bar.findOne({ '_id': req.body.barId}, function(err, bar) {
		if (bar === null) {
			res.status(401).send("400 Bad request");
		} else {

			if (req.body.password === null || req.body.password.length === 0) {
				res.status(401).send("403 Forbidden");
			}

			if (bar.validPassword(req.body.password)) {

				//create array for barId's
				if (req.session.bar === undefined) {
					req.session.bar = [];
				}

				req.session.bar.push({time: Date.now(), id: req.body.barId});
				res.redirect('/' + req.body.hash);

			} else {
				res.status(403).send("403 Forbidden");
			}
		}
	});

});


app.post('/newpassword', function(req, res) {
	User.findOne({'email': req.body.email}, function(err, user) {
		if (user === null) {
			res.status(400).send("No user registered with given e-mail");
		} else {
			var newPass = crypto.randomBytes(4).toString('hex');
			var hashedPw = user.generateHash(newPass);
			user.password = hashedPw;
			user.save(function(err) {
				if (err) {
					res.status(500).send("Internal server error. Try again later.");
				} else {

					// connection pool created only when necessary, since it's likely that we'll send these
					// emails less than one per. hour
					var smtpTransport = nodemailer.createTransport("SMTP",{
                        	service: "Gmail",
  							auth: {
  				        	user: gmail.account + "@gmail.com",
  				        	pass: gmail.password
    					}
					});


    				// setup e-mail data with unicode symbols
					var mailOptions = {
					    from: "NOREPLY <" + gmail.account + "@gmail.com>", // sender address
					    to: "<" + req.body.email + ">", // list of receivers
					    subject: "New password", // Subject line
					    text: "Your new password to toolbar is: " + newPass + " \nIf you didn't request new password, contact your toolbar admin." // plaintext body
					};

					smtpTransport.sendMail(mailOptions, function(error, response){
					    if(error){
					        console.log(error);
					        res.status(500).send("Error occured while trying to send email. Try again later.");
					    }else{
					        res.status(200).send("New password was succesfully sent to your e-mail address.");
					    }
					
					    smtpTransport.close(); // shut down the connection pool, no more messages
					});
				}
			});
		}
	});
});


//change user password
app.post('/changePassword', function(req, res) {

	var email = checkAuth(req);

	User.findOne({'email': email}, function(err, user) {
		if (user === null) {
			res.status(403).send('403 Forbidden');
		} else {

			if (req.body.oldPassword === null || req.body.oldPassword.length === 0) {
				res.status(400).send("Invalid password");
			}

			//check that old password is valid
			if (user.validPassword(req.body.oldPassword)) {

				//check that new password confirm matches
				if (req.body.newPassword !== req.body.newPassword2) {
					return res.status(400).send("Passwords don't match!");
				}

				//check that new password is not empty
				if (req.body.newPassword === null || req.body.newPassword.length === 0) {
					res.status(400).send("Password can't be empty.");
				}

				user.password = user.generateHash(req.body.newPassword);
				user.save();
				res.render('profile', {user: email, msg: "Password changed!"});

			} else {
				res.render('profile', {user: email, msg: "Wrong password!"});
			}

		}
	});
});


// Get bar page
app.get('/:id', function(req, res) {
	Bar.findOne({ hash: req.params.id}, function (err, bar){

        if (err) {
            console.error(err);
            throw err;
        }

		if (bar !== null) {
			var user = checkAuth(req);
			//check that user is auhenticated to see this bar
			var barAuth = false;
			if (req.session.bar !== undefined) {
				req.session.bar.forEach(function(b) {
					if (b.id === bar.id) {
						if (bar.passwordTimestamp > b.time) {
							barAuth = false; 
						} else {
							barAuth = true;
						}
					}
				});
			}

			if (bar.passwordEnabled === true && barAuth === false) {
        		res.render('barAuth', { user: user, barId: bar.id, hash: bar.hash });
        	} else {
        		checkEditor(bar, user, function(found) {
        			res.render('bar', { bar: bar, user: user, editor: found});
        		});
        	}


		} else {
			res.status(404).send('404 Not found');
		}

	});
});


// Create/update bar
app.post('/save', function(req, res) {

	var hash = "";

	//Generate hash and check for duplicates
	function genHash(checking) {
		if(checking === true) {
			hash = crypto.randomBytes(4).toString('hex');

    		Bar.findOne({ hash: hash}, function (err, doc) {
    			if (doc === null) {
    				genHash(false);
    			} else {
    				genHash(true);
    			}
    		});
    	}
	}

	genHash(true);

	//parse data
	var title = he.decode(stripTags(req.body.title));
	var tabs = [];
	JSON.parse(req.body.tabs).forEach(function(tab) {
		var boxes = [];

		tab.boxes.forEach(function(box) {
			for (var key in box) {
				box[key] = stripTags(box[key].toString());
			}

			boxes.push(new Box({ info: he.decode(box.info), content: box.content, description: he.decode(box.description) }));
		});

		tabs.push(new Tab({ title: he.decode(tab.title), iconID: tab.iconID, boxes: boxes }));
	});

	//create new bar & save
	if (req.body.id === "null") {
		var newBar = new Bar({ title: he.decode(title), hash: hash, tabs: tabs});

		//set bar password if enabled and user is logged in
		newBar.passwordEnabled = false;
		if (req.body.barPasswordEnabled === 'true' && checkAuth(req)) {
			var newPassword = he.decode(req.body.barPassword);
				if (newPassword.length !== 0) {
					newBar.passwordEnabled = true;
					newBar.password = newBar.generateHash(he.decode(req.body.barPassword));
					newBar.passwordTimestamp = Date.now();
				}
		}

		newBar.save(function (err, b) {
			if (err) {
				return console.error(err);
			} else {
				//add id to user's bars array if logged in
				var email = checkAuth(req);
				if (email !== null) {
					User.findOne({ email: email }, function(err, user) {
						if (user !== null) {
							user.bars.push(b.id);
							user.save(function (err) {
							});

							//save the bar creator to editors
							b.editors.push(user.id);
							b.save(function(err) {
							});

						}
					});
				}
			res.send(b.hash);
		}
	});
	//update existing bar
	} else {
		Bar.findOne({ 'hash': req.body.id}, function(err, bar) {

			if (bar !== null) {

				//check that user is in editors list
				var editor = false;
				if (checkAuth(req) !== null) {
					bar.editors.forEach(function(u) {
						if (u === req.user.id) { editor = true; }
					});
				}

				if (editor === true) {
					bar.title = title;
					bar.tabs = tabs;

					//save bar password if enabled
					if (req.body.barPasswordEnabled === 'true') {
						var newPassword = he.decode(req.body.barPassword);
						if (newPassword.length !== 0) {
							bar.passwordEnabled = true;
							bar.password = bar.generateHash(he.decode(req.body.barPassword));
							bar.passwordTimestamp = Date.now();

						}
					} else {
						bar.passwordEnabled = false;
					}

					bar.save();
					res.send(bar.hash);

				} else {
					res.status(403).send('403 Forbidden');
				}

			} else {
				res.status(400).send("400 Bad request");
			}

		});
	}

});


app.post('/register', function(req, res) {
  
  if (!checkEmail(req.body.email)) {
  	return res.status(400).send( "Invalid email address!" );
  }

  if (req.body.password !== req.body.password2) {
  	return res.status(400).send("Passwords don't match!");
  }

  passport.authenticate('local-register', function(err, user) { 	
    if (err) {
    	console.log(err);
    	return res.send(err);
	}
    if (!user) {
    	return res.status(400).send("Email address already in use!");
    } else {
    	return res.send("Account created!");
    }
  })(req, res);
});


app.post('/login', function(req, res) {
  passport.authenticate('local-login', function(err, user) { 	
    if (err) {
    	console.log(err);
    	return res.send(err);
	}
    if (!user) {
    	return res.status(401).send("Wrong email or password!");
    }

    req.login(user, {}, function(err) {
    	if (err) {
    		console.log(err);
    		return res.send(err);
    	}
    	return res.send(req.user.email);
    });


  })(req, res);
});


app.post('/logout', function(req, res) {
	if (checkAuth(req) === null) {
		return res.status(401).send("Not logged in");
	}

	req.logout();
	return res.send("Logged out");
});

};

