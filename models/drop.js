const mongoose = require('mongoose');
const lodash = require('lodash');

const Battle = require('./battle.js');

const schema = new mongoose.Schema({
  denaItemId: { type: String },
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
  mongoose.model('Drop', schema)
    .find({ battle: drop.battle })
    .then(function (drops) {
      return [drops, Battle.findById(drop.battle)]
    })
    .spread(function (drops, battle) {
      ///TODO: totally not transactionally safe
      if(!battle) { console.log("no battle for drop?"); return Promise.resolve([]); }

      battle.dropRates = battle.dropRates || {};
      battle.dropRates[drop.denaItemId] = battle.dropRates[drop.denaItemId] || {};
      for (var i in battle.dropRates) {
        if (i) {
          battle.dropRates[i] = {
            total: drops.length,
            hits: lodash.filter(drops, (d) => { return i.toString() == (d.denaItemId || "").toString() }).length
          };
        }

      }

      battle.dropRates[drop.denaItemId].rate = (battle.dropRates[drop.denaItemId].hits * 1.0) / (battle.dropRates[drop.denaItemId].total * 1.0) || 0.0;

      console.log(battle.dropRates[drop.denaItemId].rate);

      return Battle.update({ _id: drop.battle }, { dropRates: battle.dropRates });
    });
});

module.exports = mongoose.model('Drop', schema);