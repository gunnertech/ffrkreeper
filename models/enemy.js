const _ = require('lodash');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: true },
    no: { type: Number },
    name: { type: String }
  },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
  dungeon: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }
});

schema.virtual('imgUrl').get(function () {
  return `https://ffrk.static.denagames.com/dff/static/lang/image/enemy/${this.dena.id}.png`;
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.pre('save', function (next) {
  if(!this.dungeon) {
    next();
    return;
  }

  mongoose.model('Dungeon')
    .update({ _id: this.dungeon }, { $addToSet: { enemies: this._id } })
    .then(((dungeons) => {return next()} ))
    .error(((err) => next(err)));
});

schema.pre('save', function (next) {
  if(!this.battle) {
    next();
    return;
  }

  mongoose.model('Battle')
    .update({ _id: this.battle }, { $addToSet: { enemies: this._id } })
    .then(((battles) => next() ))
    .error(((err) => next(err)));
});

schema.post('save', function (enemy) { 
  var self = this;
  if(self.battle) {
    mongoose.model('Battle').findById(self.battle).populate('dungeon')
    .then((battle) => {
      if(battle.dungeon && !self.dungeon) {
        self.dungeon = battle.dungeon._id;
        self.save();
      }
      return battle.save();
    } )
  }
})

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Enemy');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? Promise.resolve(instance) : model.create(data);
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