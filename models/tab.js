// Tab model

var mongoose = require('mongoose')
, Schema = mongoose.Schema;

var boxSchema = require('../models/box.js').schema;

var tabSchema = new Schema({
	title: String,
	iconID: String,
	boxes: [boxSchema]
});
 
module.exports = mongoose.model('Tab', tabSchema);