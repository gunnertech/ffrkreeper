const mongoose = require('mongoose');
const request = require('request');
const Promise = require('bluebird');
const lodash = require('lodash');

const schema = new mongoose.Schema({
  dena: {
    event_id: {type: String, index: true },
    event_type: {type: String, index: true }
  }
}, {
  timestamps: true
});

schema.virtual('imgUrl').get(function () {
  return `https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/event/${this.dena.event_id}.png`;
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.statics.generateEvents = () => {
  const Event = mongoose.model('Event');

  return Event.find().distinct('dena.event_id')
  .then((eventIds) => {
    var newEventIds = [];

    [...Array(1000).keys()].forEach((key) => {
      if(eventIds.indexOf(key) == -1) {
        newEventIds.push(key);
      }
    });
    
    return Promise.each(newEventIds, (key) => {
      return new Promise((resolve, reject) => {
        request(`https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/event/${key}.png`, (error, response, body) => {
          if (error || response.statusCode != 200) {
            return reject(error||{name: '404', message: 'That Event does not exist'});
          }

          return resolve(key);
        })
      })
      .then((key) => {
        return Event.findOneOrCreate({'dena.event_id': key})
      })
      .catch((err) => null )
    })
  });
}

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Event');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? Promise.resolve(instance) : model.create(data);
  });
}

module.exports = mongoose.model('Event', schema);