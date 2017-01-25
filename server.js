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

//load all template partials
fs.readdirSync(path.join(__dirname, 'views/partials')).forEach(function(file) {
  if(~file.indexOf('.hbs')) engine.handlebars.registerPartial(file.replace('.hbs', ''), fs.readFileSync(__dirname + '/views/partials/' + file, 'utf8'));
})

require('./config/mongoose.js').setup(mongoose);

const dena = require('./dena.js');
const User = require('./models/user.js');
const Battle = require('./models/battle.js');
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
	.get('/dungeons/:pageNumber?', function(req, res) {
		if(!req.params.pageNumber) req.params.pageNumber = 0;
		Battle.getDungeonList(req.params.pageNumber, function(err, data) {
			if(req.params.pageNumber === 0) {
				res.render('dungeonList', { title: 'Dungeon List', dungeons: data });
			} else {
				res.render('partials/dungeons', { layout: false, dungeons: data });
			}			
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

  .get('/images', function(req, res) {
    let limit = 100;
    let page = parseInt(req.query.page || 1);
    let skip = (page-1) * limit;
    let prevPage = page > 1 ? (page-1) : null;
    let nextPage = page+1;
    Image.find().skip(skip).limit(limit).sort('url')
    .then((images) => {
      return res.render('images/index', { title: "FFRK Images", images: images, page: page, nextPage: nextPage, prevPage: prevPage });
    })
  })
  .get('/audio-files', function(req, res) {
    AudioFile.find()
    .then((audioFiles) => {
      res.render('audio-files/index', { title: "FFRK Audio Files", audioFiles: audioFiles });
    });
  })
	.get('/dungeon/:dungeonId/battles', function(req, res) {
		Battle.getBattleList(req.params.dungeonId).then((battles) => {
      return res.render('battleList', { title: 'Battle List', battles: battles });
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
        user.hasValidSessionId = true;
        user.alertLevel = parseInt(data.alertLevel) || 0;

        return user.save().return(user);
      })
      .then((user) => {
        socket.join(`/${user.dena.sessionId}`);
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

  socket.on('/drops', (sessionId, fn) => {
    User.findOne({'dena.sessionId': sessionId})
    .then((user) => {
      return [user, user.getDropMessage()];
    })
    .spread((user, message) => {
      io.sockets.in(`/${user.dena.sessionId}`).emit(`/drops/${user.dena.sessionId}`, message); /// Send it to the browser
      fn(message);

      return user;
    });

  });

  // socket.on('/battle', (data, fn) => { });
  // socket.on('/dungeon', (data, fn) => { });
  // socket.on('/world', (data, fn) => { });
  // socket.on('/user', (data, fn) => { });
});

// Battle.findOne({denaDungeonId: "11009414"}).select("-drops").then(console.log)
// Drop.find().then((drops) => { return drops.forEach((drop) => { console.log(drop); drop.save(); }); })


// setInterval(() => io.emit('time', new Date().toTimeString()), 1000); //// every second

///// Start background tasks
setInterval(() => { User.findValidWithPhone().then((users) => { 
  return Promise.map(users, (user) => {
    return user.getDropMessage().then((message) => { return [user,message]; });
  })
  .then((arrs) => {
    return Promise.map(arrs, (arr) => {
      console.log(arr[0].phone);
      console.log(arr[1]);
      if(arr[1].notify && hash.digest(arr[1]) != arr[0].lastMessage) {
        return arr[0].sendSms(arr[1].notificationMessage);
      }
      return Promise.resolve(null);
    });
  });
}) }, 6000);  /// Once every six seconds

setTimeout(() => {
  setInterval(() => { User.findValidWithEmail().then((users) => { 
    return Promise.map(users, (user) => {
      return [user, user.getDropMessage()];
    })
    .then((arrs) => {
      return Promise.map(arrs, (arr) => {
        if(arr[1].notify && hash.digest(arr[1]) != arr[0].lastMessage) {
        return arr[0].sendEmail(arr[1].notificationMessage);
      }
      return Promise.resolve(null);
      });
    });
  }) }, 6000);  /// Once every six seconds
}, 3000);