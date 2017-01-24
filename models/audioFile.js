const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  url: { type: String, index: { unique: true } }
});

module.exports = mongoose.model('AudioFile', schema);