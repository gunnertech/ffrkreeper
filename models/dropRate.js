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
    mongoose.model('Run').distinct('battle').then((battleIds) => { return mongoose.model('Battle').find({_id: {$in: battleIds}, 'dena.stamina': {$exists:true}}).select('-drops') }),
    mongoose.model('Item').find()
  ])
  .spread((battles, items) => {
    console.log(battles.length);
    console.log(items.length);
    return Promise.each(battles, (battle) => {
      return Promise.each(items, (item) => {
        return Promise.all([
          mongoose.model('Run').count({battle: battle._id}),
          mongoose.model('Run').count({battle: battle._id, items: item._id})
        ])
        .spread((runCount, successCount) => {
          if(successCount == 0) {
            return Promise.resolve(null);
          }

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