const _ = require('lodash');
const mongoose = require('mongoose');
const Promise = require('bluebird');

const Item = require('./item.js');

const schema = new mongoose.Schema({
  dena: {
    id: { type: Number, index: { unique: true } },
    name: { type: String },
    bgm: { type: String }
  },

  world: { type: mongoose.Schema.Types.ObjectId, ref: 'World' },
  battles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Battle' }],
  enemies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enemy' }],
  prizes: [{
    category: {type: Number},
    item: mongoose.Schema.Types.Mixed,
    num: { type: Number }
  }]
});

schema.set('toJSON', { getters: true, virtuals: true });
schema.set('toObject', { getters: true, virtuals: true });

schema.virtual('audioUrl').get(function () {
  if(!this.dena.bgm) {
    return null;
  }
  return `https://ffrk.static.denagames.com/dff/static/lang/bgm/bgm_m4a/${this.dena.bgm}.m4a`;
});

schema.pre('save', function (next) {
  mongoose.model('World')
    .update({ _id: this.world }, { $addToSet: { dungeons: this._id } })
    .then(((worlds) => { next(); return worlds; }))
    .error(((err) => next(err)));
});

schema.statics.findOneOrCreate = (conditions, data) => {
  const model = mongoose.model('Dungeon');
  data = data || conditions;
  return model.findOne(conditions)
  .then((instance) => {
    return instance ? Promise.resolve(instance) : model.create(data);
  });
}

schema.statics.findOneOrCreateFromJson = (dungeonData) => {
  return mongoose.model("World").findOne({"dena.id": dungeonData.world_id})
  .then((world) => {
    return mongoose.model("Dungeon").findOneOrCreate({'dena.id': dungeonData.id}, { dena: dungeonData })
    .then((dungeon) => {
      if(dungeon.prizes && dungeon.prizes.length) {
        return Promise.resolve([dungeonData, dungeon])
      }

      var prizeArray = [];

      for(var i in dungeonData.prizes) {
        dungeonData.prizes[i].forEach((prize) => {
          prizeArray.push(Object.assign(prize, {category: i}));  
        })
        
      }

      dungeon.prizes = [];
      
      return Promise.each(prizeArray, (prizeData) => {
        return mongoose.model("Item").findOneOrCreate({'dena.id': prizeData.id, 'dena.type_name': prizeData.type_name}, {dena: prizeData})
        .then((item) => {
          dungeon.prizes.push({
            item: item,
            category: prizeData.category,
            num: prizeData.num
          });
        });
      }).return([dungeonData, dungeon]);
    })
    .spread((dungeonData, dungeon) => {
      return Promise.each(dungeonData.captures, (capture) => {
        return mongoose.model('Enemy').findOneOrCreate({dungeon: dungeon._id, 'dena.id': capture.enemy_id, 'dena.name': capture.tip_battle.title}, {dungeon: dungeon._id, 'dena.id': capture.enemy_id, 'dena.name': capture.tip_battle.title})
      }).return([dungeonData, dungeon]);
    })
    .spread((dungeonData, dungeon) => {
      dungeon.world = world;
      return dungeon.save();
    })
  })
}


module.exports = mongoose.model('Dungeon', schema);