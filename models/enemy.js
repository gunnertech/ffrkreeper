const _ = require('lodash');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } },
    name: { type: String }
  },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
  dungeon: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }
});

schema.virtual('imgUrl').get(function () {
  return `https://ffrk.static.denagames.com/dff/static/lang/image/enemy/${this.dena.enemyId}.png`;
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Enemy');
  data = data || conditions;
  console.log(conditions)
  return model.findOne(conditions)
  .then((instance) => {
    console.log(instance)
    return instance ? Promise.resolve(instance) : model.create(data);
  })
  .catch((err) => {
    console.log(err);
    console.log(conditions);
    return model.findOne(conditions);
  });
}

// schema.pre('save', function (next) {
//   var self = this;

//   if(!self.dena.json || !self.dena.json.battle_id) {
//     return next();
//   }


//   mongoose.model('Enemy').count({_id: self._id})
//   .then((count) => {
//     if(count) {
//       return next();
//     } else {
//       return mongoose.model('Battle').findOne({denaBattleId: self.dena.json.battle_id}).select('-drops')
//       .then((battle) => {
//         self.battle = battle;
//         self.dena.json.params.forEach((param) => {
//           self.name = param.disp_name || self.name;
//         });

//         mongoose.model('Battle')
//           .update({ _id: self.battle }, { $addToSet: { enemies: self._id } })
//           .then(((enemies) => { next(); return enemies; }))
//           .error(((err) => {next(err); return err;} ));
//       });
//     }
//   });
// });

module.exports = mongoose.model('Enemy', schema);