const _ = require('lodash');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } },
    name: { type: String },
    bgm: { type: String },
    type: { type: Number }
  },
  series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
  dungeons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dungeon' }]
});

schema.virtual('bgImgUrl').get(function () {
  return `https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/world/${this.dena.id}.png`;  
});

schema.virtual('doorImgUrl').get(function () {
  return `https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/world/${this.dena.id}_door.png`;  
});

schema.virtual('typeName').get(function () {
  switch (this.dena.type) {
    case 1:
      return "Series"
      break;
    case 2:
      return "Challenge"
      break;
    case 5:
      return "Raid"
      break;
    default:
      return this.dena.type
  }
});

schema.virtual('audioUrl').get(function () {
  if(!this.dena.bgm) {
    return null;
  }

  return `https://ffrk.static.denagames.com/dff/static/lang/bgm/bgm_m4a/${this.dena.bgm}.m4a`;
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.pre('save', function (next) {
  mongoose.model('Series')
    .update({ _id: this.series }, { $addToSet: { worlds: this._id } })
    .then(((worlds) => { next(); return worlds; }))
    .error(((err) => next(err)));
});



module.exports = mongoose.model('World', schema);