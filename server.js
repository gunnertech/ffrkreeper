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
const Enemy = require('./models/enemy.js');

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
  .get('/users', function(req, res) {
    User.index()
    .then((users) => {
      res.render('users/index', { title: 'FFRKreeper Users', users: users });
    });
  })
  .get('/users/:userId', function(req, res) {
    User.findById(req.params.userId).populate('drops')
    .then((user) => {
      res.render('users/show', { title: user.dena.name, user: user });
    });
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


///// Start background tasks
setInterval(() => io.emit('time', new Date().toTimeString()), 1000); //// every second
setInterval(() => { User.doDropCheck(io) }, 6000);  /// Once every six seconds