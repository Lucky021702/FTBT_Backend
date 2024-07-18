const mongoose = require("mongoose");
 
let fileSchema = new mongoose.Schema({  
  index: { type: String },
  Source: { type: [String] },
  Target: { type: [String] },
  Comment: { type: [String] },
  createdOn: { type: Date, default: Date.now },
});
 
var collectionName = "BtData";
var BtData = mongoose.model("BtData", fileSchema, collectionName);
 
module.exports = BtData;
 