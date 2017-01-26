const mongoose = require('mongoose');
const lodash = require('lodash');
const moment = require('moment');

const Battle = require('./battle.js');


const schema = new mongoose.Schema({
  denaItemId: { type: String, index: true },
  qty: { type: Number },
  rarity: { type: Number },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

schema.pre('save', function (next) {
  Battle
    .update({ _id: this.battle }, { $addToSet: { drops: this._id } })
    .then(((battles) => { next(); return battles; }))
    .error(((err) => next(err)));
});

schema.pre('save', function (next) {
  mongoose.model('User')
    .update({ _id: this.user }, { $addToSet: { drops: this._id } })
    .then(((users) => { next(); return users; }))
    .error(((err) => next(err)));
});

schema.post('save', function (drop) {
  mongoose.model('Drop').find({ battle: drop.battle })
  .then(function (drops) {
    return [drops, Battle.findById(drop.battle).select('-drops')]
  })
  .spread(function (drops, battle) {
    return battle.updateDropRates();
  });
});

module.exports = mongoose.model('Drop', schema);