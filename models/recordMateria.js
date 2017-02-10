const mongoose = require('mongoose');
const Promise = require('bluebird');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } },
    effect_type: Number,
    step: Number,
    cond_description: String,
    disp_type: Number,
    buddy_id: Number,
    name: String,
    description: String,
    image_path: String
  },
  buddy: { type: mongoose.Schema.Types.ObjectId, ref: 'Buddy' },
});

schema.virtual('imgUrl').get(function () {
  return `https://ffrk.static.denagames.com${this.dena.image_path}`;
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.pre('save', function (next) {
  if(!this.buddy) {
    return next();
  }
  mongoose.model('Buddy')
  .update({ _id: (this.buddy._id || this.buddy) }, { $addToSet: { recordMaterias: this._id } })
  .then(((buddies) => { next(); return buddies; }))
  .error(((err) => next(err)));
});

schema.post('save', function (recordMateria) {
  let self = recordMateria;

  if(self.buddy) {
    return;
  }

  mongoose.model('Buddy').findOne({'dena.id': self.dena.buddy_id})
  .then((buddy) => {
    if(!buddy) {
      return Promise.resolve(null)
    }

    self.buddy = buddy;
    return self.save();
  })
});

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('RecordMateria');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? model.update(conditions, data).then(() => model.findOne(conditions)) : model.create(data);
  })
}


module.exports = mongoose.model('RecordMateria', schema);