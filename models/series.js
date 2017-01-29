const _ = require('lodash');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } },
    formal_name: String
  },
  worlds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'World' }]
});

schema.virtual('shortName').get(function () {
  return this.dena.formal_name.replace(/FINAL FANTASY /,"").replace(/FINAL FANTASY/,"I")
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });


module.exports = mongoose.model('Series', schema);