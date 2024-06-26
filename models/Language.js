const mongoose = require('mongoose');
var Schema = mongoose.Schema;
let LanguageSchema = mongoose.Schema({
	languageName:{type:String,unique:true},
	languageCode:{type:String},
	createdOn:{type:String},
	createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
	createdName:{type:String}
});

var collectionName = 'Language';
var Languages = mongoose.model('Language', LanguageSchema, collectionName);
module.exports = Languages;