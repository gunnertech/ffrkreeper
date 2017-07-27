'use strict';

try {
    require('dotenv').config();
} catch (e) {
    // ignore it
}

const PORT = process.env.PORT || 3000;
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const hbs = require('hbs');
const hash = require('json-hash');
const handlebars = require('handlebars');
const engine = hbs.create(handlebars.create());
const moment = require('moment');
const lodash = require('lodash');
const util = require('util');
const request = require('request');
const timeout = require('connect-timeout');

//load all template partials
fs.readdirSync(path.join(__dirname, 'views/partials')).forEach(function(file) {
    if (~file.indexOf('.hbs')) engine.handlebars.registerPartial(file.replace('.hbs', ''), fs.readFileSync(__dirname + '/views/partials/' + file, 'utf8'));
})

require('./config/mongoose.js').setup(mongoose);

const dena = require('./dena.js');
const utils = require('./utils.js');

/* Models */
const User = require('./models/user.js');
const Event = require('./models/event.js');
const Buddy = require('./models/buddy.js');
const Battle = require('./models/battle.js');
const Dungeon = require('./models/dungeon.js');
const Item = require('./models/item.js');
const SoulStrike = require('./models/soulStrike.js');
const Run = require('./models/run.js');
const World = require('./models/world.js');
const Ability = require('./models/ability.js');
const RecordMateria = require('./models/recordMateria.js');
const DropRate = require('./models/dropRate.js');
const Image = require('./models/image.js');
const AudioFile = require('./models/audioFile.js');


const server = express()
    .use(timeout('60s'))
    .use(bodyParser.json())
    .use(bodyParser.json(bodyParser.urlencoded({ extended: true })))
    .use(express.static(path.join(__dirname, 'public'), {
        maxAge: process.env.NODE_ENV === 'production' ? 86400000 : 0
    }))
    .set('views', path.join(__dirname, 'views'))
    .set('view options', { layout: 'layout' })
    .engine('hbs', engine.__express)
    .set('view engine', 'hbs')
    .post('/daemon', (req, res) => (
        User.findOne({ 'dena.sessionId': req.headers["x-aws-sqsd-attr-denasessionid"] })
        .then(user => (
            user.pullDrops((process.env.DENA_CURRENT_EVENT_ID || 96))
            .then(drops => (
                Promise.all([
                    user.pushDropsToHttp(drops, (process.env.NODE_ENV === 'ddevelopment' ? `http://localhost:3003/drops/${user.dena.sessionId}` : `https://ffrkreeper.com/drops/${user.dena.sessionId}`)),
                    user.pushDropsToPhone(drops)
                ])
                .return(drops)
            ))
            .catch(err => user.pushErrorToHttp(err, (process.env.NODE_ENV === 'ddevelopment' ? `http://localhost:3003/errors/${user.dena.sessionId}` : `https://ffrkreeper.com/errors/${user.dena.sessionId}`)))
            .return(user)
        ))
        .then(user => {
            setTimeout(() => {
                user.queueDropRequest();
            }, 16000)

            return user;
        })
        .then((resp) => res.json(resp))
    ))
    .post('/drops/:denaSessionId', (req, res) => {
        User.findOne({ 'dena.sessionId': req.params.denaSessionId })
            .then(user => user.pushDropsToSocket(req.body.drops, io))
            .then((resp) => res.json(resp))
    })
    .post('/errors/:denaSessionId', (req, res) => {
        User.findOne({ 'dena.sessionId': req.params.denaSessionId })
            .then(user => user.handleDropError(req.body.error, io))
            .then((resp) => res.json(resp))
    })
    .get('/items', function(req, res) {
        Item.find()
            .then((items) => {
                return res.render('items/index', { title: 'Items', items: items });
            });
    })
    .get('/record-materias', function(req, res) {
        RecordMateria.find().populate('buddy')
            .then((recordMaterias) => {
                return res.render('record-materias/index', { title: 'Record Materias', recordMaterias: recordMaterias });
            });
    })
    .get('/soul-strikes', function(req, res) {
        SoulStrike.find().populate('buddy')
            .then((soulStrikes) => {
                return res.render('soul-strikes/index', { title: 'Soul Breaks', soulStrikes: soulStrikes });
            });
    })
    .get('/abilities', function(req, res) {
        Ability.find()
            .then((abilities) => {
                return res.render('abilities/index', { title: 'Abilities', abilities: abilities });
            });
    })
    .get('/drop-rates', function(req, res) {
        DropRate.find().populate(['battle', 'item']).sort('runCount')
            .then((dropRates) => {
                return res.render('drop-rates/index', { title: 'Drop Rates', dropRates: dropRates });
            });
    })
    .get('/series', function(req, res) {
        mongoose.model('Series').find().sort('dena.formal_name').populate({ path: 'worlds', options: { sort: { 'dena.type': 1 } } })
            .then((series) => {
                return res.render('series/index', { title: 'Series', series: series });
            });
    })
    .get('/worlds/:worldId', function(req, res) {
        World.findById(req.params.worldId).populate({ path: 'dungeons', options: { sort: { 'dena.name': 1 } } }).populate('series')
            .then((world) => {
                return res.render('worlds/show', { title: world.dena.name, world: world });
            });
    })
    .get('/dungeons/:dungeonId', function(req, res) {
        mongoose.model('Dungeon').findById(req.params.dungeonId).populate({ path: 'prizes' }).populate({ path: 'battles' }).populate({ path: 'enemies' })
            .populate({
                path: 'world',
                populate: {
                    path: 'series'
                }
            })
            .then((dungeon) => {
                return res.render('dungeons/show', { title: dungeon.dena.name, dungeon: dungeon });
            });
    })
    .get('/battles/:battleId', function(req, res) {
        mongoose.model('Battle').findById(req.params.battleId).populate(['enemies']).populate([{
                    path: 'dungeon',
                    populate: {
                        path: 'world',
                        populate: {
                            path: 'series'
                        }
                    }
                },
                {
                    path: 'dropRateModels',
                    populate: {
                        path: 'item'
                    }
                }
            ])
            .then((battle) => {
                return res.render('battles/show', { title: battle.name, battle: battle });
            });
    })
    .get('/enemies/:enemyId', function(req, res) {
        mongoose.model('Enemy').findById(req.params.enemyId).populate({
                path: 'battle',
                populate: {
                    path: 'dungeon',
                    populate: {
                        path: 'world',
                        populate: {
                            path: 'series'
                        }
                    }
                }
            })
            .then((enemy) => {
                return res.render('enemies/show', { title: enemy.dena.name, enemy: enemy });
            });
    })
    .get('/dungeons', function(req, res) {
        Battle.forDungeonIndex()
            .then((dungeons) => {
                return res.render('dungeons/index', { title: 'Dungeons', dungeons: dungeons });
            });
    })
    .get('/users', function(req, res) {
        User.findForIndex()
            .then((users) => {
                return res.render('users/index', { title: 'Users', users: users });
            });
    })
    .get('/buddies', function(req, res) {
        Buddy.find()
            .then((buddies) => {
                return res.render('buddies/index', { title: "Characters", buddies: buddies });
            });
    })
    .get('/events', function(req, res) {
        return res.redirect('/banners');
    })
    .get('/banners', function(req, res) {
        Event.find().distinct('dena.event_id').then((event_ids) => {
            event_ids = lodash.sortBy(event_ids, [function(id) { return parseInt(id); }]);
            return res.render('banners/index', {
                title: "Banners",
                gachas: [...Array(700).keys()],
                events: [...Array(700).keys()],
                characters: lodash.range(501004, 501200)
            });
        })
    })
    .get('/gear', function(req, res) {
        Event.find().distinct('dena.event_id').then((event_ids) => {
            event_ids = lodash.sortBy(event_ids, [function(id) { return parseInt(id); }]);
            return res.render('gear/index', {
                weapons: lodash.flatten([
                    lodash.range(21001000, 21001200), //DAGGERS
                    lodash.range(21002000, 21002400), //SWORDS
                    lodash.range(21003000, 21003100), //KATANAS
                    lodash.range(21004000, 21004100), //AXES
                    lodash.range(21005000, 21005100), //HAMMERS
                    lodash.range(21006000, 21006100), //SPEARS
                    lodash.range(21007000, 21007100), //FISTS
                    lodash.range(21008000, 21008200), //RODS
                    lodash.range(21009000, 21009100), //STAFFS
                    lodash.range(21010000, 21010100), //BOWS
                    lodash.range(21011000, 21011100), //INSTRUMENTS
                    lodash.range(21012000, 21012100), //WHIPS
                    lodash.range(21013000, 21013100), //THROWN
                    lodash.range(21014000, 21014100), //BOOKS
                    lodash.range(21015000, 21015200), //GUNS

                    lodash.range(21030000, 21030320), //BALLS
                    lodash.range(21034000, 21034010) //DOLLS
                ]),

                armor: lodash.flatten([
                    lodash.range(22050000, 22050050), //Shields
                    lodash.range(22051000, 22051050), //HAts
                    lodash.range(22053000, 22053100), //light armor
                    lodash.range(22054000, 22054100), //heavy armor
                    lodash.range(22055000, 22055100), //robes
                    lodash.range(22056000, 22056100) //bracers
                ]),

                accessories: lodash.flatten([
                    lodash.range(23080000, 23080300)
                ])
            });
        })
    })
    .get('/images', function(req, res) {
        let limit = 100;
        let page = parseInt(req.query.page || 1);
        let skip = (page - 1) * limit;
        let prevPage = page > 1 ? (page - 1) : null;
        let nextPage = page + 1;

        Image.find().skip(skip).limit(limit).sort('url')
            .then((images) => {
                return res.render('images/index', { title: "Images", images: images, page: page, nextPage: nextPage, prevPage: prevPage });
            })
    })
    .get('/audio-files', function(req, res) {
        AudioFile.find()
            .then((audioFiles) => {
                return res.render('audio-files/index', { title: "Audio Files", audioFiles: audioFiles });
            });
    })
    .get('/enemies', function(req, res) {
        mongoose.model('Enemy').find().sort('name').populate('battle', 'denaDungeonId')
            .then((enemies) => {
                return res.render('enemies/index', { title: "Enemies", enemies: lodash.uniqBy(enemies, 'name') });
            });
    })
    .get('/', function(req, res) {
        res.render('index', { title: 'Home' });
    })
    .post('/tick', function(req, res) {
        res.send('GET request to the homepage');
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`));






const io = socketIO(server);

io.on('connection', (socket) => {
    console.log('Client connected');

    ////start talk it out bullshit
    io.sockets.emit('socketId', { 'socketId': socket.id, 'connectTime': Date.now() });

    socket.on('file', (data, fn) => {
        io.sockets.in(`room-${data.roomId}`).emit('file', Object.assign({}, data, { 'socketId': socket.id }));
    });

    socket.on('message', (data, fn) => {
        io.sockets.in(`room-${data.roomId}`).emit('message', Object.assign({}, data, { 'socketId': socket.id }));
    });

    socket.on('clear', (data, fn) => {
        io.sockets.in(`room-${data.roomId}`).emit('clear', Object.assign({}, data, { 'socketId': socket.id }));
    });

    socket.on('typing', (data, fn) => {
        io.sockets.in(`room-${data.roomId}`).emit('typing', Object.assign({}, data, { 'socketId': socket.id, 'generatedFromSocketId': data.socketId }));
    });

    socket.on('joinRoom', (data, fn) => {
        const roomName = `room-${data.roomId}`;

        socket.join(roomName);

        io.sockets.in(roomName).emit('participantCount', io.sockets.adapter.rooms[roomName].length);
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected');

        Object.keys(socket.adapter.rooms).forEach((roomName) => {
            socket.leave(roomName);
            if (io.sockets.adapter.rooms[roomName]) {
                io.sockets.in(roomName).emit('participantCount', io.sockets.adapter.rooms[roomName].length);
            }
        })
    });

    ////end talk it out bullshit

    socket.on('/signin', (data, fn) => { ////ALLOW THEM TO SIGN IN WITH EITHER A SESSIONID, PHONE OR EMAIL
        var query = [];

        if (data.sessionId) {
            query.push({ 'dena.sessionId': data.sessionId })
        }

        if (data.email) {
            query.push({ 'email': data.email });
        }

        if (data.phone) {
            data.phone = User.normalizePhone(data.phone);
            query.push({ 'phone': data.phone });
        }

        if (!query.length) {
            fn({ name: 'SessionError', message: 'That session Id is not valid' });
        } else {
            User.findOne().or(query)
                .then((user) => {
                    if (user) {
                        return Promise.resolve(user);
                    } else {
                        if (data.sessionId) {
                            return User.create({ 'dena.sessionId': data.sessionId });
                        }

                        return Promise.reject({ name: "SessionError", message: "You must provide a session id" })
                    }
                })
                .then((user) => {
                    if (data.phone) { user.phone = data.phone; }
                    if (data.email) { user.email = data.email; }
                    if (data.sessionId) {
                        user.dena.sessionId = data.sessionId;
                        user.hasValidSessionId = true;
                    }

                    user.alertLevel = parseInt(data.alertLevel) || 0;

                    return user.save().return(user);
                })
                .then((user) => {
                    socket.join(`/${user.dena.sessionId}`);
                    return user;
                })
                .then(user => {
                    if (user.isQueued) { // if user is already in a queue loop, don't add the user to another
                        return Promise.resolve(user);
                    }

                    user.isQueued = true;
                    return user.save().then(() => user.queueDropRequest()).return(user)
                })
                .then(user => {
                    return fn(user);
                })
                .catch((err) => {
                    return fn({ name: 'SessionError', message: 'That session Id is not valid' });
                });
        }
    });

    socket.on('/signout', (data, fn) => {
        var query = [];

        if (data.sessionId) {
            query.push({ 'dena.sessionId': data.sessionId })
        }

        if (data.email) {
            query.push({ 'email': data.email });
        }

        if (data.phone) {
            data.phone = User.normalizePhone(data.phone);
            query.push({ 'phone': data.phone });
        }

        if (query.length) {
            User.findOne().or(query)
                .then((user) => {
                    if (!user) {
                        return Promise.resolve(null);
                    }

                    user.alertLevel = 0;
                    user.dena.sessionId = '';

                    // _users = lodash.remove(_users, signedOutUser => user.dena.sessionId === signedOutUser.dena.sessionId)

                    return user.save().return(user);
                })
                .then((user) => {
                    fn(user);
                });
        }
    });

});




let pushDrops = () => (
        User.find({ phone: { $ne: null }, hasValidSessionId: true }).distinct('dena.sessionId')
        .then(sessionIds => (
            lodash.uniq(
                lodash.concat(
                    Object.keys(io.sockets.adapter.rooms).map(roomId => roomId.replace('/', '')),
                    sessionIds
                )
            )
        ))
        .then(sessionIds => User.find({ 'dena.sessionId': { $in: sessionIds } }))
        .then(users => (
            Promise.map(users, (user) => (
                user.pullDrops((process.env.DENA_CURRENT_EVENT_ID || 96))
                .then(drops => (
                    Promise.all([
                        user.pushDropsToSocket(drops, io),
                        user.pushDropsToPhone(drops)
                    ])
                    .return(null)
                ))
                .return(null)
                .catch(err => user.handleDropError(err, io))
            ))
            .return(null)
        )))
    .then(pushDrops)


let updateUserData = () => {
    let cutoff = moment().add(5, 'hours').toDate();

    return User.find({ hasValidSessionId: true, 'dena.updatedAt': { $lt: cutoff } })
        .then((users) => {
            return Promise.map(users, (user) => {
                return user.updateData()
                    .catch((err) => {
                        user.hasValidSessionId = false;
                        return user.save();
                    })
            })
        })
}

//DO THIS WITH CODY'S ACCOUNT SINCE IT MAY LOG OUT THE USER AND CODY HAS UNLOCKED ALL CONTENT
let buildBattles = () => {
    return Promise.all([
            Dungeon.find().populate('battles'),
            User.findOne({ hasValidSessionId: true, 'dena.name': 'SaltyNut' })
        ])
        .spread((dungeons, user) => {
            return Promise.each(dungeons, (dungeon) => {
                /// if the dungeon doesn't have any battles or has any battles without stamina, build the data for it.
                if (!dungeon.battles || dungeon.battles.length == 0 || lodash.some(dungeon.battles, (battle) => !battle.dena || !battle.dena.stamina)) {
                    return user.buildBattlesFromDungeon(dungeon.dena.id).return(dungeon);
                } else {
                    return Promise.resolve(dungeon)
                }
            })
        });
}

let buildWorlds = () => {
    return User.findOne({ hasValidSessionId: true, 'dena.name': 'SaltyNut' })
        .then((user) => {
            return user.buildWorlds().return(user)
        })
}

let buildAbilities = () => {
    return User.find({ hasValidSessionId: true, 'dena.name': 'SaltyNut' })
        .then((users) => {
            return Promise.map(users, (user) => {
                return user.getPartyList()
                    .then((json) => {
                        return Promise.each(json.abilities, (abilityData) => {
                            return Ability.findOneOrCreate({ 'dena.id': abilityData.ability_id }, {
                                dena: {
                                    id: abilityData.ability_id,
                                    category_type: abilityData.category_type,
                                    category_name: abilityData.category_name,
                                    command_icon_path: abilityData.command_icon_path,
                                    name: abilityData.name,
                                    description: abilityData.description,
                                    image_path: abilityData.image_path,
                                    rarity: abilityData.rarity
                                }
                            })
                        })
                    })
            })

        })
}

let buildSphereMaterials = () => {
    return User.find({ hasValidSessionId: true, 'dena.name': 'SaltyNut' })
        .then((users) => {
            return Promise.map(users, (user) => {
                return user.getPartyList()
                    .then((json) => {
                        return Promise.each(json.sphere_materials, (itemData) => {
                            return Item.findOneOrCreate({ 'dena.id': itemData.id }, {
                                dena: {
                                    id: itemData.id,
                                    rarity: itemData.rarity,
                                    image_path: itemData.image_path,
                                    name: itemData.name,
                                    description: itemData.description,
                                    type_name: "SPHERE_MATERIAL"
                                }
                            })
                        })
                    })
            })

        })
}

let buildRecordMaterias = () => {
    return User.find({ hasValidSessionId: true, 'dena.name': 'SaltyNut' })
        .then((users) => {
            return Promise.map(users, (user) => {
                return user.getPartyList()
                    .then((json) => {
                        return Promise.each(json.record_materias, (itemData) => {
                            return RecordMateria.findOneOrCreate({ 'dena.id': itemData.id }, {
                                dena: {
                                    id: itemData.id,
                                    effect_type: itemData.effect_type,
                                    step: itemData.step,
                                    cond_description: itemData.cond_description,
                                    disp_type: itemData.disp_type,
                                    buddy_id: itemData.buddy_id,
                                    name: itemData.name,
                                    description: itemData.description,
                                    image_path: itemData.image_path
                                }
                            })
                        })
                    })
            })

        })
}

let buildEquipmentMaterials = () => {
    return User.find({ hasValidSessionId: true, 'dena.name': 'SaltyNut' })
        .then((users) => {
            return Promise.map(users, (user) => {
                return user.getPartyList()
                    .then((json) => {
                        return Promise.each(json.equipment_sp_materials, (itemData) => {
                            return Item.findOneOrCreate({ 'dena.id': itemData.id }, {
                                dena: {
                                    id: itemData.id,
                                    rarity: itemData.rarity,
                                    image_path: itemData.image_path,
                                    name: itemData.name,
                                    description: itemData.description,
                                    type_name: "EQUIPMENT_SP_MATERIAL"
                                }
                            })
                        })
                    })
            })

        })
}

let buildMaterials = () => {
    return User.find({ hasValidSessionId: true, 'dena.name': 'SaltyNut' })
        .then((users) => {
            return Promise.map(users, (user) => {
                return user.getPartyList()
                    .then((json) => {
                        return Promise.each(json.materials, (itemData) => {
                            return Item.findOneOrCreate({ 'dena.id': itemData.id }, {
                                dena: {
                                    id: itemData.id,
                                    rarity: itemData.rarity,
                                    image_path: itemData.image_path,
                                    name: itemData.name,
                                    description: itemData.description,
                                    type_name: "ABILITY_MATERIAL"
                                }
                            })
                        })
                    })
            })

        })
}

let buildDarkMatter = () => {
    return User.find({ hasValidSessionId: true, 'dena.name': 'SaltyNut' })
        .then((users) => {
            return Promise.map(users, (user) => {
                return user.getPartyList()
                    .then((json) => {
                        return Promise.each(json.equipment_hyper_evolve_materials, (itemData) => {
                            return Item.findOneOrCreate({ 'dena.id': itemData.id }, {
                                dena: {
                                    id: itemData.id,
                                    rarity: itemData.rarity,
                                    image_path: itemData.image_path,
                                    name: itemData.name,
                                    description: itemData.description,
                                    type_name: "equipment_hyper_evolve_material".toUpperCase()
                                }
                            })
                        })
                    })
            })

        })
}

let buildSoulStrikes = () => {
    return User.find({ hasValidSessionId: true, 'dena.name': 'SaltyNut' })
        .then((users) => {
            return Promise.map(users, (user) => {
                return user.getPartyList()
                    .then((json) => {
                        return Promise.each(json.soul_strikes, (itemData) => {
                            return SoulStrike.findOneOrCreate({ 'dena.id': itemData.id }, {
                                dena: {
                                    id: itemData.id,
                                    consume_ss_point: itemData.consume_ss_point,
                                    allowed_buddy_id: itemData.allowed_buddy_id,
                                    has_broken_max_damage_threshold_soul_strike: itemData.has_broken_max_damage_threshold_soul_strike,
                                    extensive_description: itemData.extensive_description,
                                    is_burst_soul_strike: itemData.is_burst_soul_strike,
                                    name: itemData.name,
                                    soul_strike_category_id: itemData.soul_strike_category_id,
                                    is_param_booster_soul_strike: itemData.is_param_booster_soul_strike,
                                    description: itemData.description,
                                    is_ultra_soul_strike: itemData.is_ultra_soul_strike,
                                    is_shared_soul_strike: itemData.is_shared_soul_strike,
                                    image_path: itemData.image_path,
                                    required_exp: itemData.required_exp,
                                    consume_ss_gauge: itemData.consume_ss_point,
                                    is_someones_soul_strike: itemData.is_someones_soul_strike
                                }
                            })
                        })
                    })
            })

        })
}

let buildInventory = () => {
    return Promise.all([
        buildAbilities(),
        buildRecordMaterias(),
        buildSphereMaterials(),
        buildEquipmentMaterials(),
        buildMaterials(),
        buildDarkMatter(),
        buildSoulStrikes()
    ])
}

// User.find({ phone: '+18609404747', hasValidSessionId: true }).then(console.log)

// setInterval(pushDrops, 12000); // Every six seconds

// setTimeout(pushDrops, 1);

// setTimeout(pushDropsForSocketUsers, 1);
// setTimeout(pushDropsForMobileUsers, 2);

// setInterval(updateUserData, (1000 * 60 * 60 * 24)); // Every day
// setInterval(buildBattles,   (1000 * 60 * 60 * 24)); // Every day
// setInterval(buildWorlds,    (1000 * 60 * 60 * 24)); // Every day
// setInterval(buildInventory, (1000 * 60 * 60 * 24)); // Every day

// buildWorlds();
// buildBattles();




// utils.runInBg(Event.generateEvents);


/// BEGIN AREA TO RUN ONE OFF SHIT
// Battle.ensureIndexes(function(err) {
//     if (err) return console.log(err);
// });