# Challenge Toolbar

## Demo

Live demo:
[toolbar.n4sjamk.org](http://toolbar.n4sjamk.org)

## Deployment

### Linux

First make sure you have installed

```
Node.js from http://nodejs.org/
MongoDB from http://www.mongodb.org/
```

npm package manager should come installed with node. Now run the following commands

```
sudo npm install git+https://github.com/N4SJAMK/toolbar.git # Downloads files and installs node modules
```

You'll find there's a file config/gmail.js:PROTOTYPE

Add working gmail-account credentials and change the filename to gmail.js

```
./node_modules/.bin/gulp publish                  # Creates all .js files and stylesheets
./node_modules/.bin/forever PORT=80 node app.js   # Sets up server at port 80. 
```


If you like, you can change the port to e.g. 3000 and redirect traffic to port 80 with

```
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
```

----

If you get the error:

```
Failed to load c++ bson extension, using pure JS version
```

You need to modify node_modules. On app root, type

```
nano node_modules/mongoose/node_modules/mongodb/node_modules/bson/ext/index.js
```

On the line where it says

```
bson = require('../build/Release/bson');
```

Change it to

```
bson = require('bson');
```

!!!!!!!!!!!!!!!!!!!!!

Application and tests use the same database. Before running the tests, all user's are cleared from database.

!!!!!!!!!!!!!!!!!!!!!


# For Developers

To run tests, make sure you're local server is up and running, then type

```
npm test
```

If you make changes to script_dev/ you need to publish your changes before they come visible.

```
gulp publish
```

This will run lint tests, minify sass and all .js and concat them to one file.

Other options with gulp:

```
gulp scripts      -  LINT
gulp sass         -  Convert sass -> css
gulp css:minify   -  Minify all css from script_dev to public/stylesheets
gulp css:watch    -  sass -> css conversion and css:minify every time file changes in script_dev
gulp watch        -  Make gulp publish every time any file changes
```
