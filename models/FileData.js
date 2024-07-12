const mongoose = require("mongoose");

let fileSchema = new mongoose.Schema({
  index: { type: String},
  Source: { type: [String] },
  Target: { type: [String] },
  Comment: { type: [String] },
  createdOn: { type: Date, default: Date.now },
});

var collectionName = "FileData";
var Tmdata = mongoose.model("FileData", fileSchema, collectionName);

module.exports = Tmdata;
