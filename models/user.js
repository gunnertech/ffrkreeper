"use strict";

try {
    require('dotenv').config();
} catch (e) {
    // ignore it
}

const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const mongoose = require('mongoose');
const Promise = require('bluebird');
const lodash = require('lodash');
const request = require('request');
const hash = require('json-hash');
const util = require('util');

const Drop = require('./drop.js');
const Battle = require('./battle.js');
const Enemy = require('./enemy.js');
const World = require('./world.js');
const Series = require('./series.js');

const utils = require('../utils.js');
const dena = require('../dena.js');

const schema = new mongoose.Schema({
    email: { type: String, index: { unique: true, sparse: true } },
    phone: { type: String, index: { unique: true, sparse: true } },
    dena: {
        sessionId: { type: String, index: { unique: true, sparse: true } },
        user_session: { type: String, index: { unique: true, sparse: true } },
        csrfToken: String,
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
    currentRun: { type: mongoose.Schema.Types.ObjectId, ref: 'Run' }
});

schema.pre('save', function(next) {
    if (this.email == "undefined") {
        this.email = null;
    }
    next();
})

schema.pre('save', function(next) {
    this.phone = mongoose.model('User', schema).normalizePhone(this.phone);

    if (!this.phone) {
        delete this.phone;
    }

    if (!this.email) {
        delete this.email;
    }

    if (this.dena && !this.dena.sessionId) {
        delete this.dena.sessionId;
    }

    next();
});

schema.pre('save', function(next) {
    this.phone = mongoose.model('User', schema).normalizePhone(this.phone);

    next();
});

schema.statics.findForIndex = () => {
    return mongoose.model('User').find({ buddy: { $exists: true } }).distinct('dena.id')
        .then((denaIds) => {
            return Promise.map(denaIds, (denaId) => {
                return mongoose.model('User').findOne({ 'dena.id': denaId, buddy: { $exists: true } }).populate('buddy');
            });
        });
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

schema.statics.findValidWithPhone = () => {
    var query = {
        hasValidSessionId: true,
        phone: { $nin: [null, ""] }
    }
    return mongoose.model('User').find(query);
}

schema.statics.findValidWithEmail = () => {
    var query = {
        hasValidSessionId: true,
        email: { $nin: [null, ""] }
    }
    return mongoose.model('User').find(query);
}

schema.methods.populateWorlds = function(worlds) {
    var self = this;
    return Promise.each(worlds, (world) => {
        return self.getWorldDungeonData(world.dena.id)
            .then((json) => {
                if (!json.dungeons) {
                    return Promise.resolve([])
                }
                return Promise.each(json.dungeons, (dungeonData) => {
                    return mongoose.model('Dungeon').findOneOrCreateFromJson(dungeonData);
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
                        if (worldIds.indexOf(worldId) == -1) {
                            promise = World.create({
                                dena: {
                                    id: worldId,
                                    name: data[5],
                                    bgm: data[1],
                                    type: parseInt(data[12])
                                }
                            });
                        } else {
                            promise = World.findOne({ 'dena.id': worldId });
                        }

                        return promise.then((world) => {
                            return Series.findOne({ 'dena.id': seriesId })
                                .then((series) => {
                                    if (series) {
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
                mongoose.model("Image").create(image).catch((err) => {})
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
                mongoose.model("AudioFile").create(audioFile).catch((err) => {})
            });
        });
}

schema.methods.generateUsersFromRelationships = function() {
    var self = this;

    return self.getFolloweeAndFollowersData()
        .then((json) => {
            return mongoose.model('Buddy').createFromRelationship(json.followees.target_profiles);
        })
        .catch((err) => {
            return self;
        })
}

schema.methods._denaApiCall = function() {
    let methodName = [].shift.apply(arguments);
    let argArray = Array.prototype.slice.call(arguments);

    return this.auth()
        .then((authData) => {
            argArray.push(authData);
            return dena.api[methodName].apply(null, argArray);
        })
        .then((json) => {
            if (json.error == 'INVALID_USER_SESSION') {
                return this.resetAuth({}).then(() => this[methodName].apply(this, Array.prototype.slice.call(arguments)))
            }
            return Promise.resolve(json);
        })
}

schema.methods.getPartyList = function() {
    return this._denaApiCall('getPartyList');
}

schema.methods.getFolloweeAndFollowersData = function() {
    return this._denaApiCall('getFolloweeAndFollowersData');
}

schema.methods.getWorldBattles = function() {
    return this._denaApiCall('getWorldBattles');
}

schema.methods.getWorldDungeonData = function(worldId) {
    return this._denaApiCall('getWorldDungeonData', worldId);
}

schema.methods.getProfileData = function() {
    return this._denaApiCall('getProfileData');
}

schema.methods.getBattleInitDataForEventId = function(eventId) {
    return dena.api.getBattleInitDataForEventId(eventId, { sessionId: this.dena.sessionId });
}

schema.methods.doGachaDraw = function() {
    return this._denaApiCall('doGachaDraw');
}

schema.methods.doEnterDungeon = function(eventId, dungeonId) {
    return this._denaApiCall('doEnterDungeon', eventId, dungeonId);
}

schema.methods.doLeaveDungeon = function(eventId, dungeonId) {
    return this._denaApiCall('doLeaveDungeon', eventId, dungeonId);
}

schema.methods.resetAuth = function(err) {
    this.dena.user_session = null;
    this.dena.csrfToken = null;

    return this.save().return(err);
}

schema.methods.hasAuth = function() {
    return (this.dena.sessionId && this.dena.user_session && this.dena.csrfToken);
}

schema.methods.auth = function() {
    let self = this;

    if (this.hasAuth()) {
        return Promise.resolve({ sessionId: this.dena.sessionId, userSessionKey: this.dena.user_session, csrfToken: this.dena.csrfToken });
    }

    return dena.api.authData({ sessionId: this.dena.sessionId })
        .spread((sessionId, browserData, userSessionKey) => {
            self.dena.csrfToken = browserData.csrfToken;
            self.dena.user_session = userSessionKey;

            return self.save().return({ sessionId: self.dena.sessionId, userSessionKey: self.dena.user_session, csrfToken: self.dena.csrfToken });
        })
}

schema.methods.buildBattlesFromDungeon = function(dungeonId) {
    var self = this;
    return self.doEnterDungeon((process.env.DENA_CURRENT_EVENT_ID || 95), dungeonId)
        .then((json) => {
            if (!json.success) {
                return Promise.resolve(json)
            }
            return self.getWorldBattles()
        })
        .then((json) => {
            if (!json.success) {
                return Promise.resolve([])
            }
            return mongoose.model('Dungeon').findOneOrCreateFromJson(json.user_dungeon)
                .then((dungeon) => {
                    return Promise.each(json.battles, (battleData) => {
                        return mongoose.model('Battle').findOneOrCreate({ 'dena.id': battleData.id })
                            .then((battle) => {
                                battle.dena = battle.dena || {}
                                battle.dena.id = battleData.id;
                                battle.dena.name = battleData.name;
                                battle.dena.stamina = battleData.stamina;
                                battle.dungeon = dungeon._id;

                                return Battle.update({ _id: battle.id }, { dena: battle.dena, dungeon: dungeon._id })

                            });
                    });
                });
        })
        .then((dungeons) => {
            return self.doLeaveDungeon((process.env.DENA_CURRENT_EVENT_ID || 95), dungeonId);
        })
}


schema.methods.updateData = function() {
    var self = this;

    return self.getProfileData()
        .then((profileJson) => {
            utils.runInBg(mongoose.model('Buddy').checkForNewOnes, profileJson);

            self.dena.updatedAt = new Date();
            self.dena.invite_id = profileJson.invite_id;

            if (profileJson.profile) {
                self.dena.name = profileJson.profile.nickname;
                self.dena.id = profileJson.profile.user_id;
                self.dena.profile_message = profileJson.profile.profile_message;
                self.dena.supporter_buddy_soul_strike_name = profileJson.profile.supporter_buddy_soul_strike_name;
                self.dena.mnd = profileJson.profile.supporter_buddy_mnd;
                self.dena.matk = profileJson.profile.supporter_buddy_matk;
                self.dena.atk = profileJson.profile.supporter_buddy_atk;
            }

            if (!profileJson.user_supporter_buddy) {
                return self.save();
            }

            return mongoose.model('Buddy').findOneOrCreate({ 'dena.buddy_id': profileJson.user_supporter_buddy.buddy_id, 'dena.name': profileJson.user_supporter_buddy.name })
                .then((buddy) => {
                    self.buddy = buddy._id;
                    return self.save();
                });
        })
}

schema.methods.sendEmail = function(message) {
    if (!message) {
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
                if (error) {
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
        if (!message) {
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

schema.methods.handleDropError = function(err, io) {
    let self = this;

    if (err.name === "OutOfBattleError") {
        return mongoose.model('User').update({ _id: this._id }, { currentRun: null, lastMessage: null })
            .then(() => {
                return Promise.all([
                    self.pushErrorToSocket(err, io)
                ])
            }).return(self)

    } else if (err.name === 'AuthorizationError') {

        return mongoose.model('User').update({ _id: this._id }, { currentRun: null, hasValidSessionId: false })
            .then(() => {
                let err = {
                    message: "Session Id Expired: Your session id no longer valid! Please sign out and sign back in with a new session id.",
                    name: "SessionError"
                };

                return Promise.all([
                    self.pushErrorToSocket(err, io)
                ])
            }).return(self)

    } else {
        return self;
    }
}

schema.methods.pushDropsToSocket = function(drops, io) {
    let self = this;

    for (var i in io.sockets.adapter.rooms) {
        let testRoom = `/${i}`;
        if (i === `/${self.dena.sessionId}`) {
            io.sockets.in(`/${self.dena.sessionId}`).emit(`/battle_message`, { drops: drops });
            return self;
        }
    }

    return self;
}

schema.methods.pushDropsToPhone = function(drops) {
    let self = this;

    if (!self.phone) {
        return self;
    }

    let userAlertLevel = self.alertLevel || 1000;
    var message = "";

    drops.forEach((drop) => {
        if (parseInt(drop.rarity || 0) >= userAlertLevel) {
            message = `${message} ${drop.item.dena.name} x${drop.qty}`;
        }
    });

    if (!message) {
        return self;
    }

    message = `Your Drops: ${message}`;
    if (message == self.lastMessage) {
        return self;
    }
    self.lastMessage = message;

    return self.sendSms(message).return(self.save());
}

schema.methods.pushDropsToEmail = function(drops) {
    let self = this;

    if (!self.email) {
        return self;
    }

    let userAlertLevel = self.alertLevel || 1000;
    var message = "";

    drops.forEach((drop) => {
        if (parseInt(drop.rarity || 0) >= userAlertLevel) {
            message = ` ${message}${drop.item.dena.name} x${drop.qty}`;
        }
    });

    if (!message) {
        return self;
    }

    message = `Your Drops: ${message}`;
    if (message == self.lastMessage) {
        return self;
    }
    self.lastMessage = message;

    return self.sendEmail(message).return(self.save());
}

schema.methods.pushErrorToSocket = function(err, io) {
    let self = this;

    for (var i in io.sockets.adapter.rooms) {
        let testRoom = `/${i}`;
        if (i === `/${self.dena.sessionId}`) {
            io.sockets.in(`/${self.dena.sessionId}`).emit(`/battle_message`, err);
            return self;
        }
    }

    return self;
}

schema.methods.pushErrorToPhone = function(err) {
    let self = this;

    if (!self.phone) {
        return self;
    }

    return self.sendSms(err.message).return(self)
}

schema.methods.pushErrorToEmail = function(err) {
    let self = this;

    if (!self.email) {
        return self;
    }

    return self.sendEmail(err.message).return(self)
}

schema.methods.startNewRun = function(json) {
    let self = this;
    let Run = mongoose.model("Run");
    let run = new Run();

    run.user = self;
    run.drops = [];

    return Battle.findOneOrCreate({ 'dena.id': json.battle.battle_id })
        .then((battle) => {
            if (battle.dungeon) {
                return Promise.resolve(battle);
            }

            return mongoose.model('Dungeon').findOne({ 'dena.id': json.battle.dungeon.dungeon_id })
                .then((dungeon) => {
                    battle.dungeon = dungeon;
                    return battle.save().return(battle);
                })
        })
        .then(function(battle) {
            run.battle = battle;

            var drops = [];
            var enemies = [];

            json.battle.rounds.forEach((round) => {
                round.drop_item_list.forEach((drop) => {
                    drops.push(drop);
                });

                round.enemy.forEach((enemy) => {
                    enemy.children.forEach((child) => {
                        child.drop_item_list.forEach((drop) => {
                            drops.push(drop);
                        });

                        child.params.forEach((param) => {
                            param.enemy_id = child.enemy_id;
                            enemies.push(param);
                        });
                    });
                });
            });

            return [Promise.resolve(lodash.filter(drops, (d) => !!d.item_id)), Promise.resolve(enemies), run.save()];
        })
        .spread((dropData, enemyData, r) => {
            return Promise.all([
                Promise.map(enemyData, (e) => {
                    return Enemy.findOneOrCreate({ battle: run.battle._id, 'dena.id': e.enemy_id, 'dena.no': e.no, 'dena.name': e.disp_name })
                }),
                Promise.map(dropData, (d) => {
                    return mongoose.model('Item').findOneOrCreate({ 'dena.id': d.item_id })
                        .then((item) => {

                            return Drop.create({
                                    battle: run.battle._id,
                                    user: self._id,
                                    qty: d.num,
                                    rarity: d.rarity,
                                    item: item._id,
                                    run: run
                                })
                                .then((drop) => {
                                    run.drops.push(drop);
                                })
                        });
                })
            ])
        })
        .then(() => {
            return run.save()
        })
}

schema.methods.pullDrops = function(eventId) {
    let self = this;
    let User = mongoose.model("User");

    return self.getBattleInitDataForEventId(eventId)
        .then((json) => {
            if (!json.success) {
                return Promise.reject({
                    name: "OutOfBattleError",
                    message: "Not in Battle: Go join a battle to see your drops!"
                });
            }

            if (self.currentRun) {
                return Promise.resolve(self.currentRun);
            }

            return self.startNewRun(json);
        })
        .then((run) => {
            return mongoose.model('Drop').find({ run: run }).populate('item').populate({ path: 'battle', select: '-drops', populate: { path: 'dropRateModels' } });
        })
}


module.exports = mongoose.model('User', schema);