const _ = require('lodash');
const mongoose = require('mongoose');
const lodash = require('lodash');

const schema = new mongoose.Schema({
  dena: {
    name: { type: String, index: true },
    buddy_id: { type: Number, index: { unique: true } }
  }
});

schema.virtual('imgUrl').get(function () {
  return `https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/buddy/${this.dena.buddy_id}/${this.dena.buddy_id}.png`;
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.statics.checkForNewOnes = (profileJson) => {
  mongoose.model('Buddy').find().distinct('dena.buddy_id')
  .then((buddyIds) => {
    var buddiesToCreate = [];
    profileJson.buddies.forEach( (buddyData) => {
      if(!lodash.find(buddyIds, (b) => { return b.toString() == buddyData.buddy_id.toString(); })) {
        var name = buddyData.name;

        if(buddyData.buddy_id == 10000200) {
          name = 'Tyro';
        } else if(buddyData.buddy_id == 10400100) {
          name = 'Dark Knight Cecil';
        } else if( name == 'Cecil') {
          name = 'Paladin Cecil';
        }

        
        buddiesToCreate.push({
          dena: {
            name: name,
            buddy_id: buddyData.buddy_id
          }
        });
      }
    });
    return mongoose.model('Buddy').create(lodash.uniqBy(buddiesToCreate, (b) => { return b.dena.buddy_id}));
  })
  .then((buddies) => {
    return console.log(buddies)
  })
}


module.exports = mongoose.model('Buddy', schema);