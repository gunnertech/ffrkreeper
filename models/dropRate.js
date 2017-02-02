const mongoose = require('mongoose');
const lodash = require('lodash');
const Promise = require('bluebird');

const schema = new mongoose.Schema({
  perRun: { type: Number },
  perStamina: {type: Number},
  items: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }
});


module.exports = mongoose.model('DropRate', schema);