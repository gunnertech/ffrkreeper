//ww/compile/en

const mongoose = require('mongoose');
const request = require('request');
const Promise = require('bluebird');
const lodash = require('lodash');

const schema = new mongoose.Schema({
  dena: {
    event_id: {type: String, index: true },
    event_type: {type: String, index: true }
  }
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
    console.log(eventIds)
    eventIds = lodash.differenceWith([...Array(1000).keys()], eventIds, lodash.isEqual);
    console.log(eventIds)
    
    return Promise.map(eventIds, (key) => {
      return new Promise(((resolve, reject) => {
        request(`https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/event/${key}.png`, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            Event.count({'dena.event_id': key})
            .then((count) => {
              if(count){ return resolve(null); }

              return Event.create({dena: {event_id: key}})
              .then((event) => {
                return resolve(event);
              })
              .catch((err) => {
                return resolve(null);
              })
            })
          } else {
            resolve(null);
          }
        });
      }));
    });
  });
}

module.exports = mongoose.model('Event', schema);