const mongoose = require('mongoose');
const lodash = require('lodash');
const moment = require('moment');

const dropData = require('../dropData.js');


const schema = new mongoose.Schema({
  denaItemId: { type: String, index: true }, //TODO: REFACTOR THIS OUT


  qty: { type: Number },
  rarity: { type: Number },

  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
  enemy: { type: mongoose.Schema.Types.ObjectId, ref: 'Enemy' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});


schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.pre('save', function (next) {
  mongoose.model('Battle')
    .update({ _id: this.battle }, { $addToSet: { drops: this._id } })
    .then(((battles) => { next(); return battles; }))
    .error(((err) => next(err)));
});

schema.post('save', function (drop) {
  mongoose.model('Drop').find({ battle: drop.battle })
  .then(function (drops) {
    return [drops, mongoose.model('Battle').findById(drop.battle).select('-drops')]
  })
  .spread(function (drops, battle) {
    if(battle) {
      return battle.updateDropRates();
    }

    return null;
  });
});



//TODO: REFACTOR OUT
schema.statics.getImgUrl = (denaItemId) => {
  var dropName = mongoose.model('Drop').getName(denaItemId);

  if(!dropName) return 'https://placeholdit.imgix.net/~text?txtsize=50&txt=%3F&w=112&h=112&txttrack=0';

  if(dropName.match(/Orb/) || dropName.match(/Crystal/)) {
    return 'https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/ability_material/' + denaItemId + '/' + denaItemId + '_112.png';
  } else {
    return 'https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/common_item/' + denaItemId + '.png';
  }
}

//TODO: REFACTOR OUT
schema.statics.getName = (denaItemId) => {
  return dropData[denaItemId];
}

module.exports = mongoose.model('Drop', schema);