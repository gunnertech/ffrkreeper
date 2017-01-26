const _ = require('lodash');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: String,
  dena: {
    enemyId: { type: String, index: { unique: true } },
    json: mongoose.Schema.Types.Mixed
  },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }
});

schema.virtual('imgUrl').get(function () {
  return `https://ffrk.static.denagames.com/dff/static/lang/image/enemy/${this.dena.enemyId}.png`;
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.pre('save', function (next) {
  var self = this;

  if(!self.dena.json || !self.dena.json.battle_id) {
    return next();
  }


  mongoose.model('Enemy').count({_id: self._id})
  .then((count) => {
    if(count) {
      return next();
    } else {
      return mongoose.model('Battle').findOne({denaBattleId: self.dena.json.battle_id}).select('-drops')
      .then((battle) => {
        self.battle = battle;
        self.dena.json.params.forEach((param) => {
          self.name = param.disp_name || self.name;
        });

        mongoose.model('Battle')
          .update({ _id: self.battle }, { $addToSet: { enemies: self._id } })
          .then(((enemies) => { next(); return enemies; }))
          .error(((err) => {next(err); return err;} ));
      });
    }
  });
});

module.exports = mongoose.model('Enemy', schema);