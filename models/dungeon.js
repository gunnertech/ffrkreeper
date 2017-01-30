const _ = require('lodash');
const mongoose = require('mongoose');

const Item = require('./item.js');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true, sparse: true } },
    name: { type: String },
    bgm: { type: String }
  },

  world: { type: mongoose.Schema.Types.ObjectId, ref: 'World' },
  battles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }],
  enemies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enemy' }],
  prizes: [{
    category: {type: Number},
    item: mongoose.Schema.Types.Mixed,
    num: { type: Number }
  }]
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.virtual('audioUrl').get(function () {
  if(!this.dena.bgm) {
    return null;
  }
  return `https://ffrk.static.denagames.com/dff/static/lang/bgm/bgm_m4a/${this.dena.bgm}.m4a`;
});

schema.pre('save', function (next) {
  mongoose.model('World')
    .update({ _id: this.world }, { $addToSet: { dungeons: this._id } })
    .then(((worlds) => { next(); return worlds; }))
    .error(((err) => next(err)));
});

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Dungeon');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? Promise.resolve(instance) : model.create(data);
  });
}


module.exports = mongoose.model('Dungeon', schema);