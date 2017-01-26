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
    ///TODO: totally not transactionally safe
    // if(!battle) { return Promise.resolve([]); }

    battle.dropRates = battle.dropRates || {};
    battle.dropRates[drop.denaItemId] = battle.dropRates[drop.denaItemId] || {};
    for (var i in battle.dropRates) {
      if (i) {
        battle.dropRates[i].rate = (battle.dropRates[i].hits * 1.0) / (battle.dropRates[i].total * 1.0) || 0.0;
      }

    }

    battle.dropRates[drop.denaItemId] = {
      total: drops.length,
      hits: lodash.filter(drops, (d) => { return drop.denaItemId.toString() == (d.denaItemId || "").toString() }).length
    };

    battle.dropRates[drop.denaItemId].rate = (battle.dropRates[drop.denaItemId].hits * 1.0) / (battle.dropRates[drop.denaItemId].total * 1.0) || 0.0;

    console.log(battle.dropRates);
    return battle.save();
  });
});

module.exports = mongoose.model('Drop', schema);