const mongoose = require('mongoose');
const lodash = require('lodash');
const moment = require('moment');


const schema = new mongoose.Schema({
  qty: { type: Number },
  rarity: { type: Number },

  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
  run: { type: mongoose.Schema.Types.ObjectId, ref: 'Run' },
  enemy: { type: mongoose.Schema.Types.ObjectId, ref: 'Enemy' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});


schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.pre('save', function (next) {
  mongoose.model('Battle')
    .update({ _id: this.battle }, { $addToSet: { drops: this._id } })
    .then(((battles) => { next(); return battles; }))
    .error(((err) => next(err)));
});

// schema.post('save', function (drop) {
//   mongoose.model('Drop').find({ battle: drop.battle })
//   .then(function (drops) {
//     return [drops, mongoose.model('Battle').findById(drop.battle).select('-drops')]
//   })
//   .spread(function (drops, battle) {
//     if(battle) {
//       return battle.updateDropRates();
//     }

//     return null;
//   });
// });



module.exports = mongoose.model('Drop', schema);