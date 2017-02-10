const lodash = require('lodash');
const mongoose = require('mongoose');
const Promise = require('bluebird');

const Drop = require('./drop.js');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } },
    name: { type: String },
    stamina: { type: Number }
  },  
  drops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }],
  enemies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enemy' }],
  dungeon: { type: mongoose.Schema.Types.ObjectId, ref: 'Dungeon' },
  dropRateModels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DropRate' }]
});

schema.virtual('name').get(function () {
  return this.dena.name || this.dena.id;
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.pre('save', function (next) {
  if(!this.dungeon) {
    return next();
  }
  mongoose.model('Dungeon')
  .update({ _id: this.dungeon }, { $addToSet: { battles: this._id } })
  .then(((dungeons) => { next(); return dungeons; }))
  .error(((err) => next(err)));
});

schema.pre('save', function (next) {
  var self = this;
  if(self.name) {
    return next();
  }

  mongoose.model('Enemy').find({battle: this._id})
  .then((enemies) => {
    self.name = lodash.uniq(lodash.map(enemies,(enemy) => enemy.name));
    return self.save();
  })
  .then((battle) => {
    return next();
  });
});

schema.methods.recordRun = function(user, drops) {
  return mongoose.model("Run").create({
    user: user,
    drops: lodash.compact(lodash.map(drops,"_id")),
    battle: this
  });
}

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Battle');
  data = data || conditions;
  return model.findOne(conditions).select('-drops')
  .then((instance) => {
    return instance ? Promise.resolve(instance) : model.create(data);
  });
}

module.exports = mongoose.model('Battle', schema);