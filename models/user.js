"use strict";

try {
  require('dotenv').config();
} catch (e) {
  // ignore it
}

const http = require('http');
const util = require('util');
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const mongoose = require('mongoose');
const Promise = require('bluebird');
const lodash = require('lodash');
const request = require('request');

const CURRENT_PATH = '/dff/event/challenge/94/get_battle_init_data';
//const CURRENT_PATH = '/dff/event/suppress/2025/single/get_battle_init_data';

const Drop = require('./drop.js');
const Battle = require('./battle.js');
const Enemy = require('./enemy.js');

const getDropInfo = require('../drops.js');

function buildDrops(json) {
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

const schema = new mongoose.Schema({
  email: String,
  phone: String,
  dena: {
    sessionId: String,
    userId: String,
    accessToken: String
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
  drops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }]
});

schema.pre('save', function (next) {
  this.phone = mongoose.model('User', schema).normalizePhone(this.phone);

  next();
});

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

schema.statics.doDropCheck = (io) => {
  return mongoose.model('User', schema).find({ 'dena.sessionId': { $ne: null }, hasValidSessionId: true })
  .then((users) => {
    return Promise.map(users, (user) => {
      return user.checkForDrops()
      .then((message) => {
        io.emit(`/drops/${user.dena.sessionId}`, message); /// Send it to the browser
        
        if(message.notify) {
          var notificationMessage = "";

          message.drops.forEach((drop) => {
            const userAlertLevel = user.alertLevel || 1000; /// set it to a high number that rarity won't reach

            if(drop.rarity && parseInt(drop.rarity) >= userAlertLevel) {
              notificationMessage = ` ${notificationMessage}${drop.name} x${drop.num}`;
            }
          });

          if(notificationMessage) {
            notificationMessage = `Your drops: ${notificationMessage}`;

            if (user.email) {
              user.sendEmail(notificationMessage);
            };

            if (user.phone) {
              user.sendSms(notificationMessage);
            }
          }
        }
      })
      .catch((error) => {
        io.emit(`/drops/${user.dena.sessionId}`, error); /// Send it to the browser
      
        if (error.notify) {
          if (user.email) {
            user.sendEmail(error.message);
          }

          if (user.phone) {
            user.sendSms(error.message);
          }
        }
      })
    }).return(users);
  })
  .then((users) => {
    console.log(`Polled for ${users.length} users!`)
  });
}

schema.methods.sendEmail = function (message) {
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

schema.methods.checkForDrops = function () {
  var self = this;

  var options = {
    url: 'http://ffrk.denagames.com/' + CURRENT_PATH,
    proxy: process.env.PROXY_URL,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'http_session_sid=' + this.dena.sessionId
    }
  };



  return new Promise((resolve, reject) => {
    request.get(options, function (e, r, data) {
      if (e) return reject(e);

      var message = {};
      var json = {};
      var drops = [];

      try {
        json = JSON.parse(data);
      } catch (e) { 
        data = "";
      }




      if (data && data.length === 0) {
        const proxiedError = new Error();
        proxiedError.message = "Session Id Expired: Your session id no longer valid! Please reset it.";
        proxiedError.name = 'Session Error';
        proxiedError.notify = true;

        self.hasValidSessionId = false;
        self.save().then(() => reject(proxiedError));
        return;
      } else if (!json.success) {
        const proxiedError = new Error();
        proxiedError.message = "Not in Battle: Go join a battle to see your drops!";
        proxiedError.name = 'Out of Battle Error';
        proxiedError.notify = false; /// Not important enough to send an alert

        self.inBattle = false;
        self.save().then(() => reject(proxiedError));
        return;
      }

      //// COMMENT THIS IN TO SEE THE FULL JSON FOR THE BATTLE
      // console.log(util.inspect(json, false, null));

      drops = buildDrops(json);


      Battle.findOne({ denaBattleId: json.battle.battle_id })
      .then(function (battle) {
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
      .then(function (battle) { 
        battle.denaBattleId = json.battle.battle_id;
        battle.denaDungeonId = json.battle.dungeon.dungeon_id;
        battle.eventId = json.battle.event.event_id;
        battle.eventType = json.battle.event.event_type;
        battle.dropRates = battle.dropRates || {};

        return Battle.update({ _id: battle._id }, battle).then(() => { return battle; });
      })
      .then(function (battle) {

        message.notify = !self.inBattle; ////// DON'T KEEPY SENDING ALERTS
        message.duplicate = self.inBattle;

        if(self.inBattle) {
          //// DON'T RECORD THE SAME DROPS AGAIN
          /// But we still need to keep going to build the drop rate
          return Promise.resolve(null);
        }
        console.log("Let's record this drop!");
        self.inBattle = true;

        return self.save().return(
          Promise.map(drops, (d) => {
            if (d.item_id) {
              console.log("OK, create it")
              console.log({
                battle: battle._id,
                user: self._id,
                denaItemId: d.item_id,
                qty: d.num,
                rarity: d.rarity
              })
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
        return Battle.findOne({ denaBattleId: json.battle.battle_id }); /// the battle will now have the drops, let's get the drop rate;
      })
      .then((battle) => {
        drops.forEach((d) => {
          if (d.item_id && battle.dropRates && battle.dropRates[d.item_id]) {
            d.dropRate = battle.dropRates[d.item_id];
            d.denaDungeonId = battle.denaDungeonId;
          }
        });
        message.drops = drops;
        resolve(message);
      });
    });
  });
};

module.exports = mongoose.model('User', schema);