const _ = require('lodash');
const mongoose = require('mongoose');
const Promise = require('bluebird');

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

schema.virtual('bannerImgUrl').get(function () {
  if(this.dena.type == 2) {
    return `https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/event/${this.dena.event_id}.png`;  
  }

  return this.bgImgUrl;
});

schema.virtual('doorImgUrl').get(function () {
  return `https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/world/${this.dena.id}_door.png`;  
});

schema.virtual('dena.event_id').get(function () {
  let stringId = this.dena.id.toString();

  return parseInt(stringId.substr(stringId.length - 3));
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

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('World');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? Promise.resolve(instance) : model.create(data);
  });
}



module.exports = mongoose.model('World', schema);