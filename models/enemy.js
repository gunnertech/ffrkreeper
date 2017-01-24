const _ = require('lodash');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: String,
  dena: {
    enemyId: String,
    json: mongoose.Schema.Types.Mixed
  },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }
});

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