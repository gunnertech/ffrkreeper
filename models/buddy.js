const _ = require('lodash');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  dena: {
    name: { type: String, index: { unique: true } },
    buddy_id: { type: Number, index: { unique: true } }
  }
});

schema.virtual('imgUrl').get(function () {
  return `https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/buddy/${this.buddy_id}/${this.buddy_id}.png`;
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });


module.exports = mongoose.model('Buddy', schema);