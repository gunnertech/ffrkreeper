"use strict";

try {
  require('dotenv').config();
} catch(e) {
  // ignore it
}

//const util = require('util');
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const mongoose = require('mongoose');
const Promise = require('bluebird');
const lodash = require('lodash');
const request = require('request');
const hash = require('json-hash');
const util = require('util');

const CURRENT_PATH = '/dff/event/challenge/94/get_battle_init_data';
//const CURRENT_PATH = '/dff/event/suppress/2025/single/get_battle_init_data';

const Drop = require('./drop.js');
const Battle = require('./battle.js');
const Enemy = require('./enemy.js');
const World = require('./world.js');
const Series = require('./series.js');

const getDropInfo = require('../drops.js');
const utils = require('../utils.js');
const dena = require('../dena.js');

const schema = new mongoose.Schema({
  email: { type: String, index: { unique: true, sparse: true } },
  phone: { type: String, index: { unique: true, sparse: true } },
  dena: {
    sessionId: { type: String, index: { unique: true, sparse: true } },
    accessToken: String,
    name: String,
    id: { type: String, index: true },
    updatedAt: Date,
    invite_id: String,
    supporter_buddy_soul_strike_name: String,
    profile_message: String,
    mnd: Number,
    matk: Number,
    atk: Number
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
  buddy: { type: mongoose.Schema.Types.ObjectId, ref: 'Buddy' },
  drops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }]
});

schema.pre('save', function(next) {
  if(this.email == "undefined") {
    this.email = null;
  }
  next();
})

schema.pre('save', function(next) {
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

schema.pre('save', function(next) {
  this.phone = mongoose.model('User', schema).normalizePhone(this.phone);

  next();
});

schema.statics.findForIndex = () => {
  return mongoose.model('User').find({ hasValidSessionId: true, buddy: { $exists: true } }).distinct('dena.id')
		.then((denaIds) => {
			return Promise.map(denaIds, (denaId) => {
				return mongoose.model('User').findOne({ 'dena.id': denaId, hasValidSessionId: true, buddy: { $exists: true } }).select('-dena.json -drops').populate('buddy');
			});
		});
}

schema.statics.buildDrops = (json, battle) => {
  var drops = [];

  json.battle.rounds.forEach(function(round) {
    round.drop_item_list.forEach(function(drop) {
      drops.push(drop);
    });

    round.enemy.forEach(function(enemy) {
      enemy.children.forEach(function(child) {
        child.drop_item_list.forEach(function(drop) {
          drops.push(drop);
        });
        Promise.each(child.params, (param) => {
          return mongoose.model('Enemy').findOneOrCreate({battle: battle._id, 'dena.id': child.enemy_id, 'dena.no': param.no, 'dena.name': param.disp_name}).then(() => null)   
        })
      });
    });
  });

  return drops;
}

schema.statics.normalizePhone = (phone) => {
  if(phone) {
    ///Strip out any non numeric characters
    phone = phone.toString().replace(/\D/g, '');

    if(phone.length >= 11 && phone.indexOf('+') == -1) {
      phone = `+${phone}`;
    } else if(phone.length < 11) {
      phone = `+1${phone}`; //ASSUME IT'S A US NUMBER
    }
  }

  return phone;
}

schema.statics.findValidWithPhone = () => {
  var query = {
    hasValidSessionId: true,
    phone: { $nin: [null, ""] }
  }
  return mongoose.model('User').find(query).select('-dena.json -drops')
}

schema.statics.findValidWithEmail = () => {
  var query = {
    hasValidSessionId: true,
    email: { $nin: [null, ""] }
  }
  return mongoose.model('User').find(query).select('-dena.json -drops')
}

schema.methods.populateWorlds = function(worlds) {
  return Promise.each(worlds, (world) => {
    return self.getWorldDungeonData(world.dena.id)
    .then((json) => {
      return Promise.each(json.dungeons, (dungeonData) => {
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
      });
    });
  });
}

schema.methods.buildWorlds = function() {
  const self = this;
  const World = mongoose.model('World');
  const Series = mongoose.model('Series');

  return World.find().distinct('dena.id')
  .then((worldIds) => {

    return dena.api.getJsonBlobs(this.dena.sessionId)
    .then((blobs) => {
      return Promise.each(blobs, (data) => {
        const worldId = parseInt(data[4]);
        const seriesId = parseInt(parseInt(data[7]));
        var promise = null;

        if(worldIds.indexOf(worldId) == -1) {        
          promise = World.create({
            dena: {
              id: worldId,
              name: data[5],
              bgm: data[1],
              type: parseInt(data[12])
            }
          });
        } else {
          promise = World.findOne({'dena.id': worldId});
        }

        return promise.then((world) => {
          return Series.findOne({'dena.id': seriesId})
          .then((series) => {
            if(series) {
              return Promise.resolve(series);
            }

            return Series.create({
              dena: {
                id: seriesId,
                formal_name: data[3]
              }
            });
          })
          .then((series) => {
            world.series = series._id;
            return world.save();
          })
        })
      })
    })
  })
  .then(() => {
    return World.find().populate('series');
  })
  .then((worlds) => {
    return self.populateWorlds(worlds);
  })
}

schema.methods.cacheImages = function(images) {
  var self = this;
  (
    images ? Promise.resolve(images) : dena.api.getImages(self.dena.sessionId)
  )
		.then((images) => {
			var remoteImages = lodash.map(images, 'url');
			return [remoteImages, mongoose.model("Image").find({ url: { $in: remoteImages } })];
		})
		.spread((remoteImages, images) => {
			var existingImages = lodash.map(images, 'url');

			var newImages = lodash.map(lodash.uniq(lodash.differenceWith(remoteImages, existingImages, lodash.isEqual)), (img) => { return { url: img }; });

			newImages.forEach((image) => {
				mongoose.model("Image").create(image).catch((err) => { })
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
			return [remoteAudioFiles, mongoose.model("AudioFile").find({ url: { $in: remoteAudioFiles } })];
		})
		.spread((remoteAudioFiles, audioFiles) => {
			var existingAudioFiles = lodash.map(audioFiles, 'url');

			var newAudioFiles = lodash.map(lodash.uniq(lodash.differenceWith(remoteAudioFiles, existingAudioFiles, lodash.isEqual)), (img) => { return { url: img }; });

			newAudioFiles.forEach((audioFile) => {
				mongoose.model("AudioFile").create(audioFile).catch((err) => { })
			});
		});
}

schema.methods.generateUsersFromRelationships = function() {
  var self = this;

  return dena.api.authData({ sessionId: this.dena.sessionId })
  .spread((sessionId, browserData, userSessionKey) => {
    return dena.api.getFolloweeAndFollowersData({ sessionId: sessionId, userSessionKey: userSessionKey, csrfToken: browserData.csrfToken });
  })
  .then((json) => {
    utils.runInBg(mongoose.model('Buddy').createFromRelationship, json.followees.target_profiles);
    return self;
  })
  .catch((err) => {
    return self;
  })
}

schema.methods.getWorldBattles = function() {
  return dena.api.authData({ sessionId: this.dena.sessionId })
  .spread((sessionId, browserData, userSessionKey) => {
    return dena.api.getWorldBattles({ sessionId: sessionId, userSessionKey: userSessionKey });
  });
}

schema.methods.getWorldDungeonData = function(worldId) {
  return dena.api.authData({ sessionId: this.dena.sessionId })
  .spread((sessionId, browserData, userSessionKey) => {
    return dena.api.getWorldDungeonData(worldId, { sessionId: sessionId, userSessionKey: userSessionKey });
  });
}

schema.methods.getBattleInitDataForEventId = function(eventId) {
  return dena.api.authData({ sessionId: this.dena.sessionId })
  .spread((sessionId, browserData, userSessionKey) => {
    return dena.api.getBattleInitDataForEventId(eventId, { sessionId: sessionId });
  });
}

schema.methods.updateData = function() {
  var self = this;

  return dena.api.authData({ sessionId: this.dena.sessionId })
		.spread((sessionId, browserData, userSessionKey) => {
			return dena.api.getProfileData({ sessionId: sessionId, userSessionKey: userSessionKey, csrfToken: browserData.csrfToken });
		})
		.then((profileJson) => {
      utils.runInBg(mongoose.model('Buddy').checkForNewOnes, profileJson);
      
			self.dena.updatedAt = new Date();
			self.dena.invite_id = profileJson.invite_id;

			if(profileJson.profile) {
				self.dena.name = profileJson.profile.nickname;
				self.dena.id = profileJson.profile.user_id;
				self.dena.profile_message = profileJson.profile.profile_message;
				self.dena.supporter_buddy_soul_strike_name = profileJson.profile.supporter_buddy_soul_strike_name;
        self.dena.mnd = profileJson.profile.supporter_buddy_mnd;
        self.dena.matk = profileJson.profile.supporter_buddy_matk;
        self.dena.atk = profileJson.profile.supporter_buddy_atk;
			}

			if(profileJson.user_supporter_buddy) {
				return mongoose.model('Buddy').findOne({ 'dena.buddy_id': profileJson.user_supporter_buddy.buddy_id })
					.then((buddy) => {
						if(buddy) {
							return Promise.resolve(buddy);
						}

						return mongoose.model('Buddy').create({
							'dena.buddy_id': profileJson.user_supporter_buddy.buddy_id,
							'dena.name': profileJson.user_supporter_buddy.name
						});
					})
					.then((buddy) => {
						self.buddy = buddy._id;
						return self.save();
					})
					.return(self);
			}

			return self.save();
		})
		.catch((err) => { console.log(err); });
}

schema.methods.sendEmail = function(message) {
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

  try {
    return new Promise((resolve, reject) => {
      sg.API(request, (error, response) => {
        if(error) {
          error.name = "Email Error";
          reject(error);
        } else {
          resolve(response);
        }
      });
    })
  } catch (e) {
    return Promise.reject(e);
  }
};

schema.methods.sendSms = function(message) {
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
      if(!err) {
        resolve(responseData)
      } else {
        err.name = "SMS Error";
        reject(err);
      }
    });
  });
};

schema.methods.getDropMessage = function() {
  let self = this;

  var message = {
    notificationMessage: "",
    notify: true
  };

  return dena.api.getBattleInitDataForEventId((process.env.DENA_CURRENT_EVENT_ID || 94), { sessionId: self.dena.sessionId })
		.then(function(json) {
			if(!json.success) {
				self.inBattle = false;
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

			// let images = dena.api.extraFilesFromBlob('png', JSON.stringify(json));
			// let audioFiles = dena.api.extraFilesFromBlob('m4a', JSON.stringify(json));

			// self.cacheAudioFiles(audioFiles);
			// self.cacheImages(images);

			var drops = [];

			return Battle.findOneOrCreate({ 'dena.id': json.battle.battle_id })
			.then(function(battle) {
        drops = mongoose.model('User').buildDrops(json, battle);

        if(battle.dungeon) {
          return Promise.resolve(battle);
        }

        return mongoose.model('Dungeon').findOne({'dena.id': json.battle.dungeon.dungeon_id})
        .then((dungeon) => {
          battle.dungeon = dungeon;
          return battle.save();
        })
      })
      .then(function(battle) {
				if(self.inBattle) {
					//// DON'T RECORD THE SAME DROPS AGAIN
					/// But we still need to keep going to build the drop rate
					return Promise.resolve(battle);
				}

				self.inBattle = true;

				return self.save()
				.then(() => {
					return Promise.map(drops, (d) => { //IF IT HAS AN item_id, it's woth saving to the db
						if(!d.item_id) {
							return Promise.resolve(null);
						}

            return mongoose.model('Item').findOneOrCreate({'dena.id': d.item_id})
            .then((item) => {
              return  Drop.create({
                battle: battle._id,
                user: self._id,
                qty: d.num,
                rarity: d.rarity,
                item: item
              });
            });
					})
				}).return(battle);
			})
			.then((battle) => {
				/// the battle will now have the drops, let's get the drop rate;
				return Battle.findOne({ _id: battle._id }).select('-drops');
			})
			.then((battle) => {
        return Promise.map(lodash.filter(drops, (drop) => !!drop.item_id), (d) => {
          return mongoose.model('Item').findOne({'dena.id': d.item_id})
          .then((item) => {
            d.item = item;
            return d;
          })
        })
        .then((drops) => {
          drops.forEach((d) => {
            if(battle.dropRates && battle.dropRates[d.item._id]) {
              d.dropRate = battle.dropRates[d.item._id];
              d.battle = battle._id;
            }
          });

          message.drops = drops;

          const userAlertLevel = self.alertLevel || 1000; /// If not set, default to a high number that rarity won't reach

          message.drops.forEach((drop) => {
            if(parseInt(drop.rarity || 0) >= userAlertLevel) {
              message.notificationMessage = ` ${message.notificationMessage}${drop.name} x${drop.num}`;
            }
          });

          if(message.notificationMessage) {
            message.notificationMessage = `Your Drops: ${message.notificationMessage}`;
          }

          return message;

        })
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