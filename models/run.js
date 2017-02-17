const mongoose = require('mongoose');
const lodash = require('lodash');
const Promise = require('bluebird');

const schema = new mongoose.Schema({
  drops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }],
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.pre('save', function (next) {
  let self = this;

  Promise.all([
    mongoose.model('Drop').find({_id: {$in: self.drops}}).distinct('item')
    .then((itemIds) => {
      self.items = itemIds;
      return Promise.resolve(itemIds)
    }),

    mongoose.model('User').findById(this.user)
    .then((user) => {
      user.currentRun = self;
      return user.save() 
    })
  ])
  .then((user) => {
    return next();
  })
});

schema.post('save', function (run) {
  mongoose.model('Run').findById(run._id).populate('items').populate({path: 'battle', select: "-drops"})
  .then((run) => {
    return mongoose.model('Drop').find({battle: run.battle._id}).distinct('item');
  })
  .then((itemIds) => {
    return mongoose.model('DropRate').calculateFor(run.battle, itemIds);
  });
})


module.exports = mongoose.model('Run', schema);