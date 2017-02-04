const mongoose = require('mongoose');
const Promise = require('bluebird');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } },
    category_type: Number,
    category_name: String,
    command_icon_path: String,
    name: String,
    description: String,
    image_path: String,
    rarity: Number
  }
});

schema.virtual('imgUrl').get(function () {
  return `https://ffrk.static.denagames.com${this.dena.image_path}`;
});

schema.virtual('iconUrl').get(function () {
  return `https://ffrk.static.denagames.com${this.dena.command_icon_path}`;
});


schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Ability');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? model.update(conditions, data).then(() => model.findOne(conditions)) : model.create(data);
  })
}


module.exports = mongoose.model('Ability', schema);