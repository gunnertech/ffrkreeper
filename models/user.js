"use strict";

try {
  require('dotenv').config();
} catch (e) {
  // ignore it
}

const http = require('http');
//const util = require('util');
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const mongoose = require('mongoose');
const Promise = require('bluebird');
const lodash = require('lodash');
const request = require('request');
const hash = require('json-hash');

const CURRENT_PATH = '/dff/event/challenge/94/get_battle_init_data';
//const CURRENT_PATH = '/dff/event/suppress/2025/single/get_battle_init_data';

const Drop = require('./drop.js');
const Battle = require('./battle.js');
const Enemy = require('./enemy.js');

const getDropInfo = require('../drops.js');
const dena = require('../dena.js');

const schema = new mongoose.Schema({
  email: { type: String, index: { unique: true, sparse: true } },
  phone: { type: String, index: { unique: true, sparse: true } },
  dena: {
    sessionId: { type: String, index: { unique: true, sparse: true } },
    userId: { type: String, index: true },
    accessToken: String,
    name: String,
    id: { type: String, index: true },
    updatedAt: Date,
    json: mongoose.Schema.Types.Mixed
  },
  hasValidSessionId: {
    type: Boolean,
    default: true
  },
  inBattle: {
    type: Boolean,
    default: true
  },
  alertLevel: { 
    type: Number, 
    min: 0,
    max: 6,
    default: 0
  },
  lastMessage: String,
  drops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }]
});

schema.pre('save', function (next) {
  if(this.email == "undefined") {
    this.email = null;
  }
  next();
})

schema.pre('save', function (next) {
  this.phone = mongoose.model('User', schema).normalizePhone(this.phone);

  if(!this.phone) {
    delete this.phone;
  }

  if(!this.email) {
    delete this.email;
  }

  if(this.dena && !this.dena.sessionId) {
    delete this.dena.sessionId;
  }

  next();
});

schema.pre('save', function (next) {
  this.phone = mongoose.model('User', schema).normalizePhone(this.phone);

  next();
});

schema.statics.index = () => {
  return mongoose.model('User', schema).find({ 'dena.name': { $ne: null } })
}

schema.statics.buildDrops = (json) => {
  var drops = [];

  json.battle.rounds.forEach(function (round) {
    round.drop_item_list.forEach(function (drop) {
      drops.push(getDropInfo(drop));
    });

    round.enemy.forEach(function (enemy) {

      enemy.children.forEach(function (child) {
        if(enemy.is_sp_enemy === '1') { ///// IT'S A BOSS BATTLE
          Enemy.count({'dena.enemyId': child.enemy_id})
          .then((count) => {
            if(!count) {
              child.battle_id = json.battle.battle_id;
              var e = new Enemy();
              e.dena = {
                enemyId: child.enemy_id,
                json: child
              }
              e.save();
            }
          });
        }
        child.drop_item_list.forEach(function (drop) {
          drops.push(getDropInfo(drop));
        });
      });
    });
  });

  return drops;
}

schema.statics.normalizePhone = (phone) => {
  if (phone) {
    ///Strip out any non numeric characters
    phone = phone.toString().replace(/\D/g, '');

    if (phone.length >= 11 && phone.indexOf('+') == -1) {
      phone = `+${phone}`;
    } else if (phone.length < 11) {
      phone = `+1${phone}`; //ASSUME IT'S A US NUMBER
    }

    
  }

  return phone;
}

schema.statics.updateData = () => {
  return mongoose.model('User').find({ 'dena.sessionId': { $ne: null }, hasValidSessionId: true }).select('-dena.json -drops')
  .then((users) => {
    return Promise.map(users, (user) => {
      return user.updateData();
    });
  });
}

schema.statics.findValidWithPhone = () => {
  var query = {
    hasValidSessionId: true,
    phone: { $nin: [null,""] }
  }
  return mongoose.model('User').find(query).select('-dena.json -drops')
}

schema.statics.findValidWithEmail = () => {
  var query = {
    hasValidSessionId: true,
    email: { $nin: [null,""] }
  }
  return mongoose.model('User').find(query).select('-dena.json -drops')
}

schema.methods.cacheImages = function(images) {
  var self = this;
  (
    images ? Promise.resolve(images) : dena.api.getImages(self.dena.sessionId)
  )
  .then((images) => {
    var remoteImages = lodash.map(images, 'url');
    return [remoteImages, mongoose.model("Image").find({url: { $in: remoteImages }})];
  })
  .spread((remoteImages, images) => {
    var existingImages = lodash.map(images, 'url');
    
    var newImages = lodash.map(lodash.uniq(lodash.differenceWith(remoteImages, existingImages, lodash.isEqual)), (img) => { return {url: img}; });

    newImages.forEach((image) => {
      mongoose.model("Image").create(image).catch((err) => { } )
    });

  });

}


schema.methods.cacheAudioFiles = function(audioFiles) {
  var self = this;
  (
    audioFiles ? Promise.resolve(audioFiles) : dena.api.getAudioFiles(self.dena.sessionId)
  )
  .then((audioFiles) => {
    var remoteAudioFiles = lodash.map(audioFiles, 'url');
    return [remoteAudioFiles, mongoose.model("AudioFile").find({url: { $in: remoteAudioFiles }})];
  })
  .spread((remoteAudioFiles, audioFiles) => {
    var existingAudioFiles = lodash.map(audioFiles, 'url');
    
    var newAudioFiles = lodash.map(lodash.uniq(lodash.differenceWith(remoteAudioFiles, existingAudioFiles, lodash.isEqual)), (img) => { return {url: img}; });

    newAudioFiles.forEach((audioFile) => {
      mongoose.model("AudioFile").create(audioFile).catch((err) => { } )
    });

  });

}

schema.methods.updateData = function() {
  var self = this;

  return dena.api.authData({sessionId: this.dena.sessionId})
  .spread((sessionId, browserData, userSessionKey) => {
    return dena.api.getWorldBattles({sessionId: sessionId, userSessionKey: userSessionKey});
  })
  .then((json) => {

    if(json.user) {
      self.dena.json = json.user;
      self.dena.id = json.user.id;
      self.dena.name = json.user.name;
      self.dena.updatedAt = new Date();

      /// let this run in the background
      self.cacheImages();
      self.cacheAudioFiles();
      
      return self.save();  
    } else {
      return Promise.resolve(null);
    }
    
  })
  .catch(() => {});
}

schema.methods.sendEmail = function (message) {
  if(!message) {
    return Promise.resolve("");
  }

  let helper = require('sendgrid').mail;
  let from_email = new helper.Email('no-reply@ffrk-creeper.herokuapp.com');
  let to_email = new helper.Email(this.email);
  let subject = message;
  let content = new helper.Content('text/plain', 'Brought to you by Gunner Technology');
  let mail = new helper.Mail(from_email, subject, to_email, content);

  let sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
  let request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });

  return new Promise((resolve, reject) => {
    sg.API(request, (error, response) => {
      if (error) {
        error.name = "Email Error";
        reject(error);
      } else {
        resolve(response);
      }
    });
  })
};

schema.methods.sendSms = function (message) {
  var self = this;

  return new Promise((resolve, reject) => {
    if(!message) {
      return resolve("");
    }

    twilio.sendMessage({
      to: self.phone,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: message
    }, (err, responseData) => {
      if (!err) {
        resolve(responseData)
      } else {
        err.name = "SMS Error";
        reject(err);
      }
    });
  });
};

schema.methods.getDropMessage = function () {
  let self = this;

  var message = { 
    notificationMessage: " ",
    notify: true
  };

  return dena.api.getBattleInitDataForEventId((process.env.DENA_CURRENT_EVENT_ID||94), {sessionId: self.dena.sessionId})
  .then(function(json) {
    if(!json.success) {
      return self.save().then(() => {
        return {
          error: true,
          message: "Not in Battle: Go join a battle to see your drops!",
          notificationMessage: "Not in Battle: Go join a battle to see your drops!",
          name: "Out of Battle Error",
          notify: false
        };
      });
    }

    let images = dena.api.extraFilesFromBlob('png',JSON.stringify(json));
    let audioFiles = dena.api.extraFilesFromBlob('m4a',JSON.stringify(json));

    self.cacheAudioFiles(audioFiles);
    self.cacheImages(images);

    var drops = mongoose.model('User').buildDrops(json);


    return Battle.findOne({ denaBattleId: json.battle.battle_id }).select('-drops')
    .then(function (battle) { //// FIND OR CRATE THE BATTLE
      if (battle) {
        return Promise.resolve(battle);
      } else {
      return Battle.create({
        denaBattleId: json.battle.battle_id,
        denaDungeonId: json.battle.dungeon.dungeon_id,
        eventId: json.battle.event.event_id,
        eventType: json.battle.event.event_type,
        dropRates: {}
      });
      }
    })
    .then(function (battle) { ///// UPDATE THE BATTLE WITH THE MOST RECENT DATA
      battle.denaBattleId = json.battle.battle_id;
      battle.denaDungeonId = json.battle.dungeon.dungeon_id;
      battle.eventId = json.battle.event.event_id;
      battle.eventType = json.battle.event.event_type;
      battle.dropRates = battle.dropRates || {};

      return Battle.update({ _id: battle._id }, battle).then(() => { return battle; });
    })
    .then(function (battle) {

      // message.notify = !self.inBattle; ////// DON'T KEEP SENDING ALERTS

      if(self.inBattle) {
        //// DON'T RECORD THE SAME DROPS AGAIN
        /// But we still need to keep going to build the drop rate
        return Promise.resolve(null);
      }
      self.inBattle = true;

      return self.save().return(
        Promise.map(drops, (d) => { //IF IT HAS AN item_id, it's woth saving to the db
          if (d.item_id) {
            console.log("Let's record this drop!");
            return Drop.create({
              battle: battle._id,
              user: self._id,
              denaItemId: d.item_id,
              qty: d.num,
              rarity: d.rarity
            });
          }

          return Promise.resolve(null);
        })
      );
    })
    .then(() => {
      /// the battle will now have the drops, let's get the drop rate;
      return Battle.findOne({ denaBattleId: json.battle.battle_id }).select('-drops');
    })
    .then((battle) => {
      drops.forEach((d) => {
        if (d.item_id && battle.dropRates && battle.dropRates[d.item_id]) {
          d.dropRate = battle.dropRates[d.item_id];
          d.denaDungeonId = battle.denaDungeonId;
        }
      });
      message.drops = drops;

      const userAlertLevel = self.alertLevel || 1000; /// If not set, default to a high number that rarity won't reach

      message.drops.forEach((drop) => {
        if(parseInt(drop.rarity||0) >= userAlertLevel) {
          message.notificationMessage = ` ${message.notificationMessage}${drop.name} x${drop.num}`;
        }
      });

      if(message.notificationMessage) {
        message.notificationMessage = `Your Drops: ${message.notificationMessage}`;
      }
      
      return message;
    });
  })
  .catch(function(err) {
    self.inBattle = false;
    self.hasValidSessionId = false;
    return self.save().then(() => {
      return {
        error: true,
        message: "Session Id Expired: Your session id no longer valid! Please reset it.",
        name: "Session Error",
        notificationMessage: "Session Id Expired: Your session id no longer valid! Please reset it.",
        notify: true
      };
    });
  });
}

module.exports = mongoose.model('User', schema);