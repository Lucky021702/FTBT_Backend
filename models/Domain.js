const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const domainSchema = new Schema({
  domainName: {
    type: String,
    required: true,
  },
  fileDomainName: {
    type: String,
    required: true,
  },
  subDomainName: {
    type: String,
    required: true,
  },
});

const Domain = mongoose.model('domain', domainSchema);

module.exports = Domain;
