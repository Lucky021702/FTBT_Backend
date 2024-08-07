const mongoose = require('mongoose');

const DomainSchema = new mongoose.Schema({
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

const Domain = mongoose.model('domain', DomainSchema,"domain");

module.exports = Domain;
