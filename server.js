'use strict';

try {
  require('dotenv').config();
} catch(e) {
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

//load all template partials
fs.readdirSync(path.join(__dirname, 'views/partials')).forEach(function(file) {
  if(~file.indexOf('.hbs')) engine.handlebars.registerPartial(file.replace('.hbs', ''), fs.readFileSync(__dirname + '/views/partials/' + file, 'utf8'));
})

require('./config/mongoose.js').setup(mongoose);

const dena = require('./dena.js');
const utils = require('./utils.js');
const User = require('./models/user.js');
const Event = require('./models/event.js');
const Buddy = require('./models/buddy.js');
const Battle = require('./models/battle.js');
const Dugeon = require('./models/dungeon.js');
const Item = require('./models/item.js');
const Image = require('./models/image.js');
const AudioFile = require('./models/audioFile.js');
const Run = require('./models/run.js');


const server = express()
  .use(bodyParser.json())
  .use(bodyParser.json(bodyParser.urlencoded({ extended: true })))
  .use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? 86400000 : 0
  }))
	.set('views', path.join(__dirname, 'views'))
	.set('view options', { layout: 'layout' })

	.engine('hbs', engine.__express)
	.set('view engine', 'hbs')
  .get('/series', function(req, res) {
    mongoose.model('Series').find().sort('dena.formal_name').populate({path: 'worlds', options: { sort: { 'dena.type': 1 } } })
    .then((series) => {
      return res.render('series/index', { title: 'Series', series: series });
    });
  })
  .get('/worlds/:worldId', function(req, res) {
    mongoose.model('World').findById(req.params.worldId).populate({path: 'dungeons'}).populate('series')
    .then((world) => {
      return res.render('worlds/show', { title: world.dena.name, world: world });
    });
  })
  .get('/dungeons/:dungeonId', function(req, res) {
    mongoose.model('Dungeon').findById(req.params.dungeonId).populate({path: 'prizes'}).populate({path: 'battles'}).populate({path: 'enemies'})
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
    mongoose.model('Battle').findById(req.params.battleId).populate('enemies').populate({
      path: 'dungeon',
      populate: {
        path: 'world',
        populate: {
          path: 'series'
        }
      }
    })
    .then((battle) => {
      var promises = [];
      for(var i in battle.dropRates) {
        promises.push(mongoose.model('Item').findById(i)
        .then((item) => {
          var i = item._id.toString();
          battle.dropRates[i].item = item;
          battle.dropRates[i].rate = Math.round(battle.dropRates[i].rate *100)
        }));
      }

      return Promise.all(promises).return(battle);
    })
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
  .get('/users/:userId', function(req, res) {
    User.findById(req.params.userId).populate('drops')
    .then((user) => {
      return res.render('users/show', { title: user.dena.name, user: user });
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
        gachas: [...Array(400).keys()], 
        events: event_ids,
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
    let skip = (page-1) * limit;
    let prevPage = page > 1 ? (page-1) : null;
    let nextPage = page+1;
    
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
    mongoose.model('Enemy').find().sort('name').select('-dena.json').populate('battle', 'denaDungeonId')
    .then((enemies) => {
      return res.render('enemies/index', { title: "Enemies", enemies: lodash.uniqBy(enemies,'name') });
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

// automation.begin();

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  ///FAUX routing
  socket.on('/signin', (data, fn) => { ////ALLOW THEM TO SIGN IN WITH EITHER A SESSIONID, PHONE OR EMAIL
    var query = [];

    if(data.sessionId) {
      query.push({'dena.sessionId': data.sessionId})
    }

    if(data.email) {
      query.push({'email': data.email});
    }

    if(data.phone) {
      data.phone = User.normalizePhone(data.phone);
      query.push({'phone': data.phone});
    }

    if(!query.length) {
      fn({name: 'Session Error', message: 'That session Id is not valid'});
    } else {
      User.findOne().or(query).select('-dena.json -drops')
        .then((user) => {
          if(user) {
            return Promise.resolve(user);
          } else {
            if(data.sessionId) {
              return User.create({ 'dena.sessionId': data.sessionId });
            }

            throw new Error('Whoops!')
          }
        })
        .then((user) => {
          if(data.phone) { user.phone = data.phone; }
          if(data.email) { user.email = data.email; }
          if(data.sessionId){ 
            user.dena.sessionId = data.sessionId; 
            user.hasValidSessionId = true;  
          }
          
          user.alertLevel = parseInt(data.alertLevel) || 0;

          return user.save().return(user);
        })
        .then((user) => {
          if(!user.hasValidSessionId) { return Promise.resolve(user); }
          //// IF THEY HAVEN'T BEEN UPDATED IN A WHILE, LET'S UPDATE THEM
          if(!user.dena.updatedAt || moment(user.dena.updatedAt).add(5, 'hours').toDate() < moment(new Date()).toDate()) {
            return user.updateData().return(user);
          } else {
            return Promise.resolve(user);
          }
        })
        .then((user) => {
          socket.join(`/${user.dena.sessionId}`);
          fn(user);
        })
        .catch((err) => {
          fn({name: 'Session Error', message: 'That session Id is not valid'});
        });
    }
  });

  socket.on('/signout', (data, fn) => {
    var query = [];

    if(data.sessionId) {
      query.push({'dena.sessionId': data.sessionId})
    }

    if(data.email) {
      query.push({'email': data.email});
    }

    if(data.phone) {
      data.phone = User.normalizePhone(data.phone);
      query.push({'phone': data.phone});
    }

    if(query.length) {
      User.findOne().or(query).select('-dena.json -drops')
        .then((user) => {
          if(!user) {
            return Promise.resolve(null);
          }

          user.alertLevel = 0;

          return user.save().return(user);
        })
        .then((user) => {
          fn(user);
        });
    }
  });

  socket.on('/drops', (sessionId, fn) => {
    User.findOne({'dena.sessionId': sessionId}).select('-dena.json -drops')
    .then((user) => {
      return [user, user.getDropMessage()];
    })
    .spread((user, message) => {
      // io.sockets.in(`/${user.dena.sessionId}`).emit(`/drops/${user.dena.sessionId}`, message); /// Send it to the browser
      fn(message);

      return [user, message];
    })
    .spread((user, message) => {
      var hashedMessage = message.notificationMessage;
      if(message.notify && hashedMessage != user.lastMessage) {
        user.lastMessage = hashedMessage;
        
        return user.save()
        .then(() => {
          var promises = [];

          if(user.email && message.notificationMessage) {
            promises.push(user.sendEmail(message.notificationMessage));
          }
          if(user.phone && message.notificationMessage) {
            promises.push(user.sendSms(message.notificationMessage));
          }

          return Promise.all(promises).return(user);
        });
      } else {
        if(user.lastMessage != hashedMessage) {
          user.lastMessage = hashedMessage;
          return user.save().return(user);
        }
        return Promise.resolve(user);
      }   
        
    });

  });

});

setInterval(() => {
  utils.runInBg(Event.generateEvents);
  User.findOne({hasValidSessionId: true, 'dena.name': 'SaltyNut' }).then((user) => {
    utils.runInBg(user.buildWorlds);  
    return user;
  });
}, 3600*3600*2)




/// BEGIN AREA TO RUN ONE OFF SHIT
if(process.env.NODE_ENV === 'development') {
  
  // User.ensureIndexes(function (err) {
  //   if (err) return console.log(err);
  // });

  User.update({email: "null"}, { $unset: { email: 1 }}, {multi: true}).then(() => {})
  User.update({email: null}, { $unset: { email: 1 }}, {multi: true}).then(() => {})
  User.update({email: "undefined"}, { $unset: { email: 1 }}, {multi: true}).then(() => {})
  User.update({email: ""}, { $unset: { email: 1 }}, {multi: true}).then(() => {})
  User.update({phone: "+14082425732"}, { $unset: { phone: 1 }}, {multi: true}).then(() => {})
  User.update({phone: "null"}, { $unset: { phone: 1 }}, {multi: true}).then(() => {})
  User.update({phone: "undefined"}, { $unset: { phone: 1 }}, {multi: true}).then(() => {})
  User.update({phone: ""}, { $unset: { phone: 1 }}, {multi: true}).then(() => {})

  User.findOne({hasValidSessionId: true, 'dena.name': 'SaltyNut' }).then((user) => {
    return mongoose.model('Dungeon').find()
    .then((dungeons) => {
      return Promise.each(dungeons, (dungeon) => {
        if(!dungeon.battles || dungeon.battles.length == 0) {
          console.log(`Got one: ${dungeon._id}`);
          return user.buildBattlesFromDungeon(dungeon.dena.id).return(dungeon);
        } else {
          return Promise.resolve(dungeon)
        }
      })
    });
  })
  .then(console.log)
  .catch(console.log)


  Battle.find({denaBattleId: {$exists: true}}).select("-drops")
  .then((battles) => {
    console.log(`Battles count: ${battles.length}`)
    return Promise.each(battles, (battle) => {
      battle.denaBattleId = undefined;
      battle.denaDungeonId = undefined;
      battle.eventId = undefined;
      battle.eventType = undefined;
      battle.realm = undefined;
      battle.dungeonName = undefined;
      battle.battleName = undefined;
      battle.stamina = undefined;
      
      return battle.save();
    })
  })

  mongoose.model('User').find({'dena.json': {$exists: true }})
  .then((users) => {
    console.log(`User count: ${users.length}`)
    return Promise.each(users, (user) => {
      user.dena.json = undefined;
      user.drops = undefined;

      return user.save();
    })
  });


}