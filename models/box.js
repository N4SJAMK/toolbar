// Box model

var mongoose = require('mongoose')
, Schema = mongoose.Schema;

var boxSchema = new Schema({
	info: String,
	content: String,
	description: String
});
 
module.exports = mongoose.model('Box', boxSchema);