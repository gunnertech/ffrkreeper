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
  .update({ _id: (this.battle._id || this.battle) }, { $addToSet: { drops: this._id } })
  .then(((battles) => { next(); return battles; }))
  .error(((err) => next(err)));
});

schema.pre('save', function (next) {
  mongoose.model('Run')
  .update({ _id: (this.run._id || this.run) }, { $addToSet: { drops: this._id } })
  .then(((runs) => next() ))
  .error(((err) => next(err) ));
});



module.exports = mongoose.model('Drop', schema);