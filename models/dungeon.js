const _ = require('lodash');
const mongoose = require('mongoose');

const Item = require('./item.js');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } },
    name: { type: String },
    bgm: { type: String }
  },

  world: { type: mongoose.Schema.Types.ObjectId, ref: 'World' },
  battles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }],
  prizes: [{
    category: Number,
    item: mongoose.model('Item').schema,
    num: Number
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


module.exports = mongoose.model('Dungeon', schema);