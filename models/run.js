const mongoose = require('mongoose');
const lodash = require('lodash');
const Promise = require('bluebird');

const schema = new mongoose.Schema({
  drops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.pre('save', function (next) {
  let self = this;
  mongoose.model('User').findById(this.user)
  .then((user) => {
    user.currentRun = self;
    return user.save() 
  })
  .then((user) => {
    return next();
  })
});

schema.post('save', function (run) {
  mongoose.model('Run').findById(run._id).populate({path: 'battle', select: "-drops"}).populate({path: 'drops', populate: {path: 'item'}})
  .then((run) => {
    return mongoose.model('DropRate').calculateFor(run.battle, lodash.map(run.drops, 'item'));
  })
})


module.exports = mongoose.model('Run', schema);