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

schema.pre('save', function(next) {
    let self = this;

    Promise.all([
            mongoose.model('Drop').find({ _id: { $in: self.drops } }).distinct('item')
            .then(itemIds => {
                console.log(itemIds)
                self.items = itemIds;
                return Promise.resolve(itemIds)
            }),

            mongoose.model('User').findById(this.user)
            .then((user) => {
                console.log("GOT USER")
                user.currentRun = self;
                return user.save()
            })
        ])
        .then((user) => {
            console.log("GOT USER 2")
            return mongoose.model('Drop').find({ battle: (self.battle._id || self.battle) }).distinct('item');
        })
        .then((itemIds) => {
            console.log("GOT ITEM IDS")
            console.log(self.items)
            itemIds.push(self.items)
            return mongoose.model('DropRate').calculateFor(self.battle, lodash.uniq(lodash.flatten(itemIds)));
        })
        .then((user) => {
            console.log('DONE!!!')
            return next();
        })
});



module.exports = mongoose.model('Run', schema);