const mongoose = require('mongoose');
const lodash = require('lodash');
const Promise = require('bluebird');

const schema = new mongoose.Schema({
  runCount: { type: Number },
  perRun: { type: Number },
  perStamina: {type: Number},
  successRate: {type: Number},
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }
});

schema.pre('save', function (next) {
  mongoose.model('Battle')
  .update({ _id: this.battle }, { $addToSet: { dropRateModels: this._id } })
  .then(((battles) => { next(); return battles; }))
  .error(((err) => next(err)));
});

schema.virtual('hits').get(function () {
  return this.runCount * this.successRate;
});

schema.virtual('successPct').get(function () {
  return Math.round(this.successRate * 100)
});

schema.virtual('roundedPerRun').get(function () {
  return Math.round(this.perRun * 100) / 100
});

schema.virtual('roundedPerStamina').get(function () {
  if(!this.perStamina) {
    return null;
  }
  return Math.round(this.perStamina * 100) / 100
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });


schema.statics.calculateFor = (battle, items) => {
  
  return Promise.each(items, (item) => {
    return Promise.all([
      mongoose.model('Run').count({battle: battle._id}),
      mongoose.model('Run').count({battle: battle._id, items: item._id}),
      mongoose.model('Drop').find({battle: battle._id, item: item._id}).select('qty'),
    ])
    .spread((runCount, successCount, drops) => {
      if(successCount == 0) {
        return Promise.resolve(null);
      }

      let summedCount = drops.length ? drops.reduce((accumulator,currentValue) => {
        return accumulator + (currentValue ? (currentValue.qty || 1) : 0);
      },0) : 0;

      return mongoose.model('DropRate').findOneOrCreate({
        item: item._id,
        battle: battle._id
      },{
        runCount: runCount,
        successRate: (((successCount*1.0)/runCount*1.0)||0.0),
        perRun: (((summedCount*1.0)/runCount*1.0)||0.0),
        perStamina: (battle.dena.stamina ? (((summedCount*1.0)/battle.dena.stamina*1.0)||0.0) : 0),
        item: item._id,
        battle: battle._id
      })
      .then((dropRate) => {
        // console.log(dropRate)
        return dropRate.save(); // force it to run pre save hook
      })
    })
  })
}

schema.statics.calculate = () => {
  //, 'dena.stamina': {$exists:true}
  return Promise.all([
    mongoose.model('Run').distinct('battle').then((battleIds) => { return mongoose.model('Battle').find({_id: {$in: battleIds}}).select('-drops') }),
    mongoose.model('Item').find()
  ])
  .spread((battles, items) => {
    return Promise.each(battles, (battle) => {
      return mongoose.model('DropRate').calculateFor(battle, items)
    });
  });
}

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('DropRate');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? model.update(conditions, data).then(() => model.findOne(conditions)) : model.create(data);
  })
}


module.exports = mongoose.model('DropRate', schema);