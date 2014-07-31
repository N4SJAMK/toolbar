// Bar model

var mongoose = require('mongoose')
, Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var tabSchema = require('../models/tab.js').schema;

var barSchema = new Schema({
	title: String,
	hash: String,
	tabs: [tabSchema],
	passwordEnabled: Boolean,
	password: String,
	passwordTimestamp: Date,
	editors: [String],
	whitelist: [String]
});
 
// generating a hash
barSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
barSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('Bar', barSchema);