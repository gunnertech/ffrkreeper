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
const http = require('http');
const request = require('request');
const util = require('util');
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const mongoose = require('mongoose');
const Promise = require('bluebird');
const lodash = require('lodash');

const hbs = require('hbs');
const handlebars = require('handlebars');
const engine = hbs.create(handlebars.create());

hbs.registerPartials(__dirname + '/views/partials');

require('./config/mongoose.js').setup(mongoose);

const automation = require('./automation.js');

const User = require('./models/user.js');
const Drop = require('./models/drop.js');
const Battle = require('./models/battle.js');

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

	.get('/dungeons', function(req, res) {
		Battle.getDungeonList(function(err, data) {
			res.render('dungeonList', { title: 'Dungeon List', dungeons: data });
		})
  })
	.get('/dungeon/:dungeonId/battles', function(req, res) {
		Battle.getBattleList(req.params.dungeonId).then((battles) => {
      return res.render('battleList', { title: 'Battle List', battles: battles });
    }).catch((err) => {
      console.log(err);
      return res.status(500).send(err);
    })
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
    var query = {};

    if(data.sessionId) {
      query['dena.sessionId'] = data.sessionId;
    }

    if(data.email) {
      query['email'] = data.email;
    }

    if(data.phone) {
      query['phone'] = User.normalizePhone(data.phone);
    }

    User.findOne({ $or: [query] })
      .then((user) => {
        if(user) {
          return Promise.resolve(user);
        } else {
          return User.create({ 'dena.sessionId': data.sessionId });
        }
      })
      .then((user) => {
        if(data.phone) { user.phone = data.phone; }
        if(data.email) { user.email = data.email; }
        if(data.sessionId) { user.dena.sessionId = data.sessionId; }
        user.alertLevel = parseInt(data.alertLevel) || 0;

        return user.save().return(user);
      })
      .then((user) => {
        fn(user);
      });
  });

  socket.on('/signout', (data, fn) => {
    var query = {};

    if(data.sessionId) {
      query['dena.sessionId'] = data.sessionId;
    }

    if(data.email) {
      query['email'] = data.email;
    }

    if(data.phone) {
      query['phone'] = User.normalizePhone(data.phone);
    }

    User.findOne({ $or: [query] })
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
  });

  // socket.on('/battle', (data, fn) => { });
  // socket.on('/dungeon', (data, fn) => { });
  // socket.on('/world', (data, fn) => { });
  // socket.on('/user', (data, fn) => { });
});

//// See how many users we have that are getting notifications
// User.find()
// .then((users) => {
//   console.log(lodash.map(users,'phone'))
//   console.log(lodash.map(users,'email'))
// })

//// Fix battle drop rates
Battle.find().populate('drops')
.then((battles) => {
  // console.log(battles)
  return Promise.each(battles, (battle) => {
    var itemIds = [];

    for (var i in battle.dropRates) {
      if (i) {
        itemIds.push(i)
      }
    }

    itemIds.forEach((i) => {
      battle.dropRates[i].rate = ((battle.dropRates[i].hits * 1.0) / (battle.dropRates[i].total * 1.0) || 0.0);
    })

    return Battle.update({_id: battle._id}, {dropRates: battle.dropRates})
    .then(() => {
      return Battle.find({denaBattleId: "1090930135"}).then((battles) => { console.log(battles[0].dropRates); return battles;})
    });

  });
});

// Drop.find()
// .then((drops) => {
//   console.log(drops.length);
//   return Promise.each(drops, (drop) => {
//     return drop.save();
//   })
// })


setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
setInterval(() => { User.schema.statics.doDropCheck(io) }, 6000);