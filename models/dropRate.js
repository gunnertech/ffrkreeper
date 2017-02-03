const mongoose = require('mongoose');
const lodash = require('lodash');
const Promise = require('bluebird');

const schema = new mongoose.Schema({
  runCount: { type: Number },
  perRun: { type: Number },
  perStamina: {type: Number},
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }
});

schema.statics.calculate = () => {
  return Promise.all([
    mongoose.model('Battle').find({'dena.stamina': {$exists:true}}).select('-drops'),
    mongoose.model('Item').find(),
  ])
  .spread((battles, items) => {
    return Promise.each(battles, (battle) => {
      // console.log(battle);
      return Promise.each(items, (item) => {
        return Promise.all([
          mongoose.model('Run').count({battle: battle._id}),
          mongoose.model('Run').count({battle: battle._id, items: item._id})
        ])
        .spread((runCount, successCount) => {
          console.log(runCount);
          console.log(successCount);
          return mongoose.model('DropRate').create({
            runCount: runCount,
            perRun: (((successCount*1.0)/runCount*1.0)||0.0),
            perStamina: (((successCount*1.0)/battle.dena.stamina*1.0)||0.0),
            item: item,
            battle: battle
          })
        })
      })
    })
  })
}


module.exports = mongoose.model('DropRate', schema);