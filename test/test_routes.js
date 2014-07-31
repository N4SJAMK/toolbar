"use strict";

var assert = require('assert'),
    request = require('supertest'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Collection = mongoose.Collection,
    userModel = require('../models/user.js'),
    expect = require('chai'),
    url = 'http://localhost:3000',
    should = require('should'),
    Entities = require('html-entities').AllHtmlEntities,
    user = {};


describe('auth',function() {
   
   // clear users
  before(function(done) {
    //initialize a legit user
    user = {
      email: "seppo@jussi.com",
      password: "kultaa95",
      password2: "kultaa95"
    };

    try {
      mongoose.connect('mongodb://127.0.0.1/toolbar');
      var taotao = mongoose.model('User', userModel);
      var panda = new taotao();
      panda.collection.drop();
    } catch(err) {
      done(err);
    }
    done();
  });

  
  describe('POST /register', function() {
    it('should return 200 if valid email is given', function(done) {
      request(url)
      .post('/register')
      .send(user)
      .end(function(err, res) {
        res.status.should.equal(200);
          request(url)
          .post('/register')
          .send(user)
          .expect(400, done); // email is already in use..
      });
    });


    it('should return 400 if no password is given', function(done) {
      request(url)
      .post('/register')
      .send({email: "legit@email.com", password: "", password2: ""})
      .expect(400, done);
    });


    it('should return 400 when given invalid email', function(done) {
      var emails = [
        "muumio@jamk",
        "@niisku.com",
        "dontami.fi",
        "hemuli"
      ];

      var checked = 0;

      var onResponse = function(err, res) {
        if (err) {
          return done(err);
        }
        if (checked === (emails.length -1)) {
          return done();
        }
        ++checked;
      }

      for (var i = 0; i < emails.length; i++) {
        request(url)
        .post('/register')
        .send({ email: emails[i], password: "veljet", password2: "veljet"})
        .expect(400, onResponse);
      }

    });
  });


  describe('POST /login', function() {
    it('should return 200 when logging in with legit account', function(done) {
      request(url)
      .post('/login')
      .send(user)
      .end(function(err, res) {
        res.status.should.equal(200);
        // if user is already logged in..
        var Cookies = res.header['set-cookie'].pop().split(';')[0];
        Cookies = [Cookies + ";"];
        var req = request(url).post('/login');
        req.cookies = Cookies;
        req.send(user)
        .expect(200, done); // return 4xx ??
      });
    });


    it('should return 401 when logging in with bad account', function(done) {
      request(url)
      .post('/login')
      .send({email: "marko@polo", password: "taotao"})
      .expect(401, done);
    });
  });


  describe('GET /profile', function() {
    it('should return 403 if user is not logged in', function(done) {
      request(url)
      .get('/profile')
      .expect(403, done);
    });


    it('should return 200 if user is logged in', function(done) {
      request(url)
      .post('/login')
      .send(user)
      .end(function(err, res) {
        var Cookies = res.header['set-cookie'].pop().split(';')[0];
        Cookies = [Cookies + ";"];
        var req = request(url).get('/profile');
        req.cookies = Cookies;
        req.expect(200, done);
      });
    });
  });


  describe('POST /logout', function() {
    it('should return 200 when user tries to logout', function(done) {
      request(url)
      .post('/login')
      .send(user)
      .end(function(err, res) {
        var Cookies = res.header['set-cookie'].pop().split(';')[0];
        Cookies = [Cookies + ";"];
        var req = request(url).post('/logout');
        req.cookies = Cookies;
        req.send(user)
        .expect(200, done);
      });
    });


    it('should return 401 if user is not logged in', function(done) {
      request(url)
      .post('/logout')
      .send(user)
      .expect(401, done);
    });
  });

});



describe('Toolbar', function() {


  describe('save', function() {

    var location = "";


    it('should return 302 and hash where to find toolbar', function(done) {
      var tabit = [{title: "sepi",
                  id: 0,
                  iconID: "code",
                  boxes: [{
                    header: "narsu mään",
                    content: "users.jyu.fi/~pakahaap/tlb/tlb.htm",
                    description: "lelu band"
                    }]
                  }];
      tabit = JSON.stringify(tabit);
      request(url)
      .post('/login')
      .send(user)
      .end(function(err, res) {
        res.status.should.equal(200);
        // if user is already logged in..
        var Cookies = res.header['set-cookie'].pop().split(';')[0];
        Cookies = [Cookies + ";"];
        var req = request(url).post('/save');
        req.cookies = Cookies;
        req.type('form')        .send('title=sepi&tabs=' + tabit + '&id=null')
        .end(function(err, res) {
          location = res.header['location'];
          location.should.match(/\/.{8}$/);
          request(url)
            .get(location.slice(-9))
            .end(function(err, res) {
              res.status.should.equal(200);
              res.should.be.html;
              res.text.should.containEql('sepi');
              res.text.should.containEql('users.jyu.fi/~pakahaap/tlb/tlb.htm');
              res.text.should.containEql('lelu band');
              res.text.should.containEql('narsu mään');
              done();
            });
          });
        });
    });
  

    it('should strip HTML-tags from boxes', function(done) {
      var tabit = [{title: "sepi",
                  id: 0,
                  iconID: "ic_lock",
                  boxes: [{
                    header: "<h1>narsu mään</h1>",
                    content: "users.jyu.fi/~pakahaap/tlb/tlb.htm",
                    description: "lelu band <img src='www.google.fi/logo.png' />"
                    }]
                  }];
      tabit = JSON.stringify(tabit);
      request(url)
      .post('/login')
      .send(user)
      .end(function(err, res) {
        res.status.should.equal(200);
        // if user is already logged in..
        var Cookies = res.header['set-cookie'].pop().split(';')[0];
        Cookies = [Cookies + ";"];
        var req = request(url).post('/save');
        req.cookies = Cookies;
        req.type('form')
        .send('title=seppo&tabs=' + tabit + '&id=null')
        .end(function(err, res) {
          location = res.header['location'];
          location.should.match(/\/.{8}$/);
          request(url)
            .get(location.slice(-9))
            .end(function(err, res) {
              res.status.should.equal(200);
              res.should.be.html;
              var entities = new Entities();
              var resText = entities.decode(res.text); // now we if the result has html-tags using < instead of &lt
              resText.should.containEql('seppo');
              resText.should.containEql('users.jyu.fi/~pakahaap/tlb/tlb.htm');
              resText.should.containEql('lelu band');
              resText.should.containEql('narsu mään');
              resText.should.not.containEql('<h1>narsu mään</h1>');
              resText.should.not.containEql('<img src=\'www.google.fi/logo.png\' />');
              resText.should.not.containEql('<h1>narsu mään</h1>');
              done();
            });
        });
      });
    });


    it('should return 404 when given wrong hash', function(done) {
      request(url)
      .get('/123456789')
      .expect(404,done);
    });
  });
  

  describe('GET /', function() {
    it('should return 200', function(done) {
      request(url)
      .get('/')
      .expect(200,done);
    });
  });


  describe('GET /bars', function() {
    it('should contain the previously created bar', function(done) {
      request(url)
      .post('/login')
      .send(user)
      .end(function(err, res) {
        var Cookies = res.header['set-cookie'].pop().split(';')[0];
        Cookies = [Cookies + ";"];
        var req = request(url).get('/bars');
        req.cookies = Cookies;
        req.send()
        .end(function(err, res) {
          res.status.should.equal(200);
          res.text.should.containEql('sepi');
          done();
        });
      });
    });


    it('should return 403 if not logged in', function(done) {
      request(url)
        .get('/bars')
        .expect(403, done);
    });
  });

/*  describe('POST /newpass', function() {
    it('should return 401 if not registered', function(done) {
      request(url)
        .post('/newpass')
        .send({email: "marco@polo"})
        .end(function(err, res) {
          res.status.should.equal(401);
          done();
        });
    });

    it('should return 200 if registered', function(done) {

    });
  });*/

  // clear data and close the database connection
  after(function(done) {
    try {
      var taotao = mongoose.model('User', userModel);
      var panda = new taotao();
      panda.collection.drop();
    } catch(err) {
      done(err);
    }
    mongoose.disconnect();
    done();
  });
});