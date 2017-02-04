const mongoose = require('mongoose');
const Promise = require('bluebird');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } },
    consume_ss_point: Number,
    allowed_buddy_id: Number,
    has_broken_max_damage_threshold_soul_strike: Boolean,
    extensive_description: String,
    is_burst_soul_strike: Boolean,
    name: String,
    soul_strike_category_id: Number,
    is_param_booster_soul_strike: Boolean,
    description: String,
    is_ultra_soul_strike: Boolean,
    is_shared_soul_strike: Boolean,
    image_path: String,
    required_exp: Number,
    consume_ss_gauge: Number,
    is_someones_soul_strike: Boolean
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
  .update({ _id: (this.buddy._id || this.buddy) }, { $addToSet: { soulStrikes: this._id } })
  .then(((buddies) => { next(); return buddies; }))
  .error(((err) => next(err)));
});

schema.post('save', function (soulStrike) {
  console.log('saved a soul strike!')
  let self = soulStrike;

  if(self.buddy || !self.dena.allowed_buddy_id) {
    return;
  }

  mongoose.model('Buddy').findOne({'dena.id': self.dena.allowed_buddy_id})
  .then((buddy) => {
    console.log(buddy)
    if(!buddy) {
      return Promise.resolve(null)
    }

    self.buddy = buddy;
    return self.save();
  })
});

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('SoulStrike');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? model.update(conditions, data).then(() => model.findOne(conditions)) : model.create(data);
  })
}


module.exports = mongoose.model('SoulStrike', schema);