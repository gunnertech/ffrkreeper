const _ = require('lodash');
const mongoose = require('mongoose');
const Promise = require('bluebird');

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

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Series');
  data = data || conditions;
  console.log(conditions)
  return model.findOne(conditions)
  .then((instance) => {
    console.log(instance)
    return instance ? Promise.resolve(instance) : model.create(data);
  });
}


module.exports = mongoose.model('Series', schema);