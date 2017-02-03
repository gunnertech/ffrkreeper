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
const request = require('request');

//load all template partials
fs.readdirSync(path.join(__dirname, 'views/partials')).forEach(function(file) {
  if(~file.indexOf('.hbs')) engine.handlebars.registerPartial(file.replace('.hbs', ''), fs.readFileSync(__dirname + '/views/partials/' + file, 'utf8'));
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
const Run = require('./models/run.js');
const DropRate = require('./models/dropRate.js');
const Image = require('./models/image.js');
const AudioFile = require('./models/audioFile.js');


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
  .get('/drop-rates', function(req, res) {
    DropRate.find().populate(['battle', 'item']).sort('battle')
    .then((dropRates) => {
      return res.render('drop-rates/index', { title: 'Drop Rates', dropRates: dropRates });
    });
  })
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
    mongoose.model('Enemy').find().sort('name').populate('battle', 'denaDungeonId')
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


io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

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
      fn({name: 'SessionError', message: 'That session Id is not valid'});
    } else {
      User.findOne().or(query)
        .then((user) => {
          if(user) {
            return Promise.resolve(user);
          } else {
            if(data.sessionId) {
              return User.create({ 'dena.sessionId': data.sessionId });
            }

            return Promise.reject({name: "SessionError", message: "You must provide a session id"})
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
          socket.join(`/${user.dena.sessionId}`);
          return fn(user);
        })
        .catch((err) => {
          return fn({name: 'SessionError', message: 'That session Id is not valid'});
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
      User.findOne().or(query)
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

});

let pushDrops = () => {
  return User.find({hasValidSessionId: true})
  .then((users) => {
    return Promise.map(users, (user) => {
      return user.pullDrops((process.env.DENA_CURRENT_EVENT_ID||96))
      .then((drops) => {
        return Promise.all([
          user.pushDropsToSocket(drops, io),
          user.pushDropsToPhone(drops),
          user.pushDropsToEmail(drops)
        ])
      })
      .catch((err) => {
        return user.handleDropError(err, io);
      })
    })
  })
}

let updateUserData = () => {
  let cutoff = moment().add(5, 'hours').toDate();

  return User.find({hasValidSessionId: true, 'dena.updatedAt': {$lt: cutoff}})
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
    Dungeon.find(),
    User.findOne({hasValidSessionId: true, 'dena.name': 'SaltyNut'})
  ])
  .spread((dungeons, user) => {
    return Promise.each(dungeons, (dungeon) => {
      /// if the dungeon doesn't have any battles or has any battles without stamina, build the data for it.
      if(!dungeon.battles || dungeon.battles.length == 0 || lodash.findIndex(dungeon.battles, (battle) => !battle.stamina) != -1 ) {
        console.log(`Got one: ${dungeon._id}`);
        return user.buildBattlesFromDungeon(dungeon.dena.id).return(dungeon);
      } else {
        return Promise.resolve(dungeon)
      }
    })
  });
}

//DO THIS WITH CODY'S ACCOUNT SINCE IT MAY LOG OUT THE USER AND CODY HAS UNLOCKED ALL CONTENT
let buildWorlds = () => {
  return User.findOne({hasValidSessionId: true, 'dena.name': 'SaltyNut'})
  .then((user) => {
    return user.buildWorlds().return(user)
    .catch((err) => {
      return console.log(err);
      // user.hasValidSessionId = false;
      // return user.save();
    })
  })
}


setInterval(pushDrops, 6000); // Every six seconds
setInterval(updateUserData, (1000 * 60 * 60)); // Every hour
setInterval(buildBattles, (1000 * 60 * 60)); // Every hour
setInterval(buildWorlds, (1000 * 60 * 60 * 24)); // Every day

setTimeout(buildBattles, 1000);
setTimeout(buildWorlds, 10000);
setTimeout(updateUserData, 20000);

DropRate.calculate();


utils.runInBg(Event.generateEvents);



/// BEGIN AREA TO RUN ONE OFF SHIT
// User.ensureIndexes(function (err) {
//   if (err) return console.log(err);
// });
