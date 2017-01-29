const _ = require('lodash');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } }
  },
  world: { type: mongoose.Schema.Types.ObjectId, ref: 'World' },
  battles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }]
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });


module.exports = mongoose.model('Dungeon', schema);