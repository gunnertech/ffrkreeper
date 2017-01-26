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
const User = require('./models/user.js');
const Buddy = require('./models/buddy.js');
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
	.get('/dungeon/:dungeonId/battles', function(req, res) {
		Battle.getBattleList(req.params.dungeonId)
    .then((battles) => {
      return res.render('battles/index', { title: 'Battles', battles: battles });
    }).catch(console.log)
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

    User.findOne({ $or: [query] }).select('-dena.json -drops')
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
      .catch((err) => {
        fn({name: 'Session Error', message: 'That session Id is not valid'});
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

    User.findOne({ $or: [query] }).select('-dena.json -drops')
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
          if(user.email && user.lastMessage) {
            promises.push(user.sendEmail(message.notificationMessage));
          }
          if(user.phone && user.lastMessage) {
            promises.push(user.sendEmail(message.notificationMessage));
          }

          return Promise.all(promises).return(user);
        });
      } else {
        return Promise.resolve(user);
      }   
        
    });

  });

  // socket.on('/battle', (data, fn) => { });
  // socket.on('/dungeon', (data, fn) => { });
  // socket.on('/world', (data, fn) => { });
  // socket.on('/user', (data, fn) => { });
});



/// BEGIN AREA TO RUN ONE OFF SHIT
User.update({email: "null"}, { $unset: { email: 1 }}).then(console.log)
User.update({email: "undefined"}, { $unset: { email: 1 }}).then(console.log)
User.update({phone: "null"}, { $unset: { phone: 1 }}).then(console.log)
User.update({phone: "undefined"}, { $unset: { phone: 1 }}).then(console.log)

// User.findOne({hasValidSessionId: true, phone: '+18609404747'})
// .then((user) => {
//   return user.getFolloweesAndFollowers();
// })
// .then((json) => { 
//   followees
// })