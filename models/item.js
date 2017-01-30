const _ = require('lodash');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } },
    name: { type: String },
    image_path: { type: String },
    type_name: { type: String }
  }
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.virtual('imgUrl').get(function () {
  // if(!this.dena.bgm) {
  //   return null;
  // }
  // var formatted_type = this.type_name == "GROW_EGG" ? "growegg" : this.type_name == "COMMON" ? "common" : this.type_name.toLowerCase();

  // return `/dff/static/lang/ww/compile/en/image/${formatted_type}/${this.dena.id}/${this.dena.id}_112.png`;

  return `https://ffrk.static.denagames.com${this.dena.image_path}`;
});

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Item');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? Promise.resolve(instance) : model.create(data);
  });
}


module.exports = mongoose.model('Item', schema);