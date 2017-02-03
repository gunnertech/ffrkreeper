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
  dropRates: mongoose.Schema.Types.Mixed,
  
  drops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }],
  enemies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enemy' }],
  dungeon: { type: mongoose.Schema.Types.ObjectId, ref: 'Dungeon' }
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


// schema.methods.updateDropRates = function() {
//   var self = this;

//   return Drop.find({battle: self._id, item: {$exists: true}}).select('item')
//   .then((allDrops) => {
//     return [allDrops, lodash.uniqBy(allDrops,'item')];
//   })
//   .spread((allDrops, distinctDrops) => {
//     self.dropRates = {};
//     distinctDrops.forEach((drop) => {
//       const hits = lodash.filter(allDrops, (d) => d.item && drop.item && d.item.toString() == drop.item.toString()).length;
//       const total = allDrops.length;
//       const rate = (hits * 1.0) / (total * 1.0) || 0.0;
      
//       if(drop.item) {
//         self.dropRates[drop.item.toString()] = {
//           hits: hits,
//           total: total,
//           rate: rate
//         };    
//       }
      
//     });

//     return mongoose.model('Battle').update({_id: self._id}, {dropRates: self.dropRates});
    
//   })
//   .then(() => { 
//     return self; 
//   });
// }

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Battle');
  data = data || conditions;
  return model.findOne(conditions).select('-drops')
  .then((instance) => {
    return instance ? Promise.resolve(instance) : model.create(data);
  });
}

module.exports = mongoose.model('Battle', schema);