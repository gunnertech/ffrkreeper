'use strict';

RegExp.prototype.execAll = function(string) {
  var match = null;
  var matches = new Array();
  while (match = this.exec(string)) {
    var matchArray = [];
    for (var i in match) {
      if (parseInt(i) == i) {
        matchArray.push(match[i]);
      }
    }
    matches.push(matchArray);
  }
  return matches;
}

/************ NOTES *************

series = i.e. FF IX, XIII, etc
world = basically an event banner - ie "The Green Hunt"
dungeons = a difficulty level within a world - ie "The Green Gunt - Heroic"


********************************/

try {
  require('dotenv').config()
} catch(e) {
  // ignore it
}


const querystring = require('querystring');
const http = require('http');
const rp = require('request-promise');
const Promise = require('bluebird');
const util = require('util');
const lodash = require('lodash');


function getSessionId(userId, accessToken, sessionId) {
  return new Promise(function(resolve, reject) {

    if(sessionId) {
      resolve(sessionId);
      return;
    }

    var post_data = querystring.stringify({
      userId: userId,
      accessToken: accessToken
    });

    var req = http.request({
        host: 'ffrk.denagames.com',
        port: 80,
        path: "/dff/_api_create_session",
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
        }
    }, function(res) {
      res.setEncoding('utf8');
      var sessionId = null;
      res.rawHeaders.forEach((header) => {
        if(header.match(/http_session_sid=/)) {
          sessionId = header.match(/http_session_sid=([^;]+)/)[1];
        }
      });
      resolve(sessionId);
    });

    req.write(post_data);
    req.end();
  });
}

function getBrowserData(sessionId) {
  return new Promise(function(resolve, reject) {

    var req = http.request({
        host: 'ffrk.denagames.com',
        port: 80,
        path: "/dff/",
        method: 'GET',
        headers: {
          'Cookie': 'http_session_sid='+sessionId
        }
    }, function(res) {
      res.setEncoding('utf8');

      var data = "";

      res.on('data', (chunk) => { data += chunk; });

      res.on("end", () => {
        var matchData = data.match(/FFEnv\.csrfToken="([^"]+)";/);

        if(!matchData) {
          reject({
            message: "invalid session id",
            name: "Authorization Error"
          });

          return;
        }

        var csrfToken = matchData[1];
        var beginBattleToken = data.match(/"begin_battle_token":"([^"]+)"/)[1];
        resolve({
          csrfToken: csrfToken,
          beginBattleToken: beginBattleToken
        });
      });

    });

    req.end();
  });
}

function scrapeSplashScreen() {
  return new Promise(function(resolve, reject) {

    var req = http.request({
        host: 'ffrk.denagames.com',
        port: 80,
        path: "/dff/splash",
        method: 'GET'
    }, function(res) {
      res.setEncoding('utf8');

      var data = "";

      res.on('data', (chunk) => { data += chunk; });

      res.on("end", () => {
        resolve(data);
      });

    });

    req.end();
  });
}

function scrapeIndexScreen(sessionId) {
  sessionId = sessionId || _g.sessionId;

  return new Promise(function(resolve, reject) {

    var req = http.request({
        host: 'ffrk.denagames.com',
        port: 80,
        path: "/dff/",
        method: 'GET',
        headers: {
          'Cookie': 'http_session_sid='+sessionId
        }
    }, function(res) {
      res.setEncoding('utf8');

      var data = "";

      res.on('data', (chunk) => { data += chunk; });

      res.on("end", () => {
        resolve(data);
      });

    });

    req.end();
  });
}

function extraFilesFromBlob(fileType, blob) {
  var regex = new RegExp('"[^"]+(\.'+fileType+')"', "g");
  var matches = regex.execAll(blob);
  var files = [];

  matches.forEach((match) => {

    var url = 'https://ffrk.static.denagames.com' + match[0].replace(/Content/,'dff/static').replace(/\\/g,"").replace(/"/g,"");

    files.push({url: url});
  });

  return files;
}

function getImages(sessionId) {
  return scrapeIndexScreen(sessionId)
  .then((data) => {
    var embeddedJsonBlobs = /<script data\-app\-init\-data type="application\/json">(.+)<\/script>/g.execAll(data);

    return lodash.flatten(lodash.map(embeddedJsonBlobs, (blob) => { return extraFilesFromBlob('png', blob); }));
  });
}

function getAudioFiles(sessionId) {
  return scrapeIndexScreen(sessionId)
  .then((data) => {
    var embeddedJsonBlobs = /<script data\-app\-init\-data type="application\/json">(.+)<\/script>/g.execAll(data);

    return lodash.flatten(lodash.map(embeddedJsonBlobs, (blob) => { return extraFilesFromBlob('m4a', blob); }));
  });
}

function getUserSessionKey(sessionId, csrfToken) {
  return new Promise(function(resolve, reject) {

    var post_data = JSON.stringify({});

    var req = http.request({
        host: 'ffrk.denagames.com',
        port: 80,
        path: "/dff/update_user_session",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': 'http_session_sid='+sessionId
        }
    }, function(res) {
      var data = "";

      res.on('data', (chunk) => { data += chunk; });

      res.on("end", () => {
        var json = JSON.parse(data); 

        resolve(json.user_session_key);
      });
    });

    req.write(post_data);
    req.end();
  });
}

function doSimplePost(path, json, options) {
  options = options || {}

  var sessionId = options.sessionId || _g.sessionId;
  var userSessionKey = options.userSessionKey || _g.userSessionKey;
  var csrfToken = options.csrfToken || _g.csrfToken;

  var headers =  {
    'Content-Type': 'application/json',
    'Cookie': 'http_session_sid='+sessionId,
    'User-Session': userSessionKey,
    'X-CSRF-Token': csrfToken
  }

  console.log(headers)

  return new Promise(function(resolve, reject) {

    var post_data = JSON.stringify(json);

    var req = http.request({
        host: 'ffrk.denagames.com',
        port: 80,
        path: path,
        method: 'POST',
        headers: headers
    }, function(res) {
      var data = "";

      res.on('data', (chunk) => { data += chunk; });

      res.on("end", () => {
        var json = JSON.parse(data); 

        resolve(json);
      });
    });

    req.write(post_data);
    req.end();
  });
}

function doSimpleGet(path, options) {
  options = options || {}
  var sessionId = options.sessionId || _g.sessionId;
  var userSessionKey = options.userSessionKey || _g.userSessionKey;

  var headers =  {
    'Content-Type': 'application/json',
    'Cookie': 'http_session_sid='+sessionId
  }

  if(userSessionKey) {
    headers['User-Session'] = userSessionKey;
  }

  return new Promise(function(resolve, reject) {
    var req = http.request({
        host: 'ffrk.denagames.com',
        port: 80,
        path: path,
        method: 'GET',
        headers: headers
    }, function(res) {
      var data = "";

      res.on('data', (chunk) => { data += chunk; });

      res.on("end", () => {
        try {
          var json = JSON.parse(data);   
        } catch(e) {
          console.log(data)
          console.log(headers)
          reject({
            message: "invalid session id",
            name: "Authorization Error"
          });
        }
        

        resolve(json);
      });
    });

    req.end();
  });
}

function doEnterDungeon(challengeId, json) {
  return doSimplePost(userSessionKey, sessionId, csrfToken, "/dff/event/challenge/"+challengeId+"/enter_dungeon", json);
}

function doBeginBattle(challengeId, battleId) {
  return doSimplePost("/dff/event/challenge/"+challengeId+"/begin_battle_session", {battle_id: battleId, begin_token: _g.beginBattleToken})
  .then((json) => {
    return doSimplePost("/dff/event/challenge/"+challengeId+"/begin_battle", {battle_id: battleId, session_key: json.session_key})
  })
}

function getProfileData(options) {
  return doSimplePost("/dff/user/profile", {}, options);
}

function getRootData(options) {
  return doSimpleGet("/dff/get_root_data", options);
}

function getWorldBattles(options) {
  return doSimpleGet("/dff/world/battles", options);
}

function getFriendFollowModalInfo(options) {
  return doSimpleGet("/dff/mo/multi/world/get_friend_follow_modal_info", options);
}

function getChallengeData(challengeId, options) {
  return doSimpleGet("/dff/event/challenge/"+challengeId+"/get_data", options);
}

function getWorldDungeonData(worldId, options) {
  return doSimpleGet("/dff/world/dungeons?world_id="+worldId, options); 
}

function getDetailedFellowListing(options) {
  return doSimpleGet("/dff/relation/detailed_fellow_listing", options); 
}

function getBattleInitDataForEventId(eventId, options) {
  return doSimpleGet("/dff/event/challenge/"+eventId+"/get_battle_init_data", options);  
}

function getBattleInitDataForSuppressId(suppressId) {
  return doSimpleGet("/dff/event/suppress/"+suppressId+"/single/get_battle_init_data");  
}

/// ALL THE INFORMATION ON THE DAILIES AND WHAT'S IN THE GYSAHL GREEN STORE
function getWdayDataForEvent(id) {
  return doSimpleGet("/dff/event/wday/"+id+"/get_data");  
}

function authData(options) {
  options = options || {}
  return getSessionId(
    (options.userId || process.env.DENA_USER_ID),
    (options.accessToken || process.env.DENA_ACCESS_TOKEN),
    (options.sessionId || process.env.DENA_SESSION_ID)
  )
  .then((sessionId) => {
    return [sessionId, getBrowserData(sessionId)];
  })
  .spread((sessionId, browserData) => {
    return [sessionId, browserData, getUserSessionKey(sessionId, browserData.csrfToken)];
  });
}

var _g = {
  sessionId: null,
  userSessionKey: null,
  csrfToken: null,
  beginBattleToken: null
}

function begin(userId, accessToken, sessionId) {
  
  /// BEGIN endpoints that require only session id
  // getSessionId(
  //   (userId || process.env.DENA_USER_ID),
  //   (accessToken || process.env.DENA_ACCESS_TOKEN),
  //   (sessionId || process.env.DENA_SESSION_ID)
  // )
  // .then((sessionId) => {
  //   _g.sessionId = sessionId;
    
  //   return [

  //   ]
  // })
  // .spread(function() {
  //   console.log(util.inspect(arguments, false, null));
  // })
  // .catch(console.log);

  // if(true) { return; }

  /// BEGIN endpoints that require user session key and session id 
  authData()
  .spread((sessionId, browserData, userSessionKey) => {
    _g.sessionId = sessionId;
    _g.csrfToken = browserData.csrfToken;
    _g.beginBattleToken = browserData.beginBattleToken;
    _g.userSessionKey = userSessionKey;

    return [
      // doBeginBattle(92, 1130920135)
      // doEnterDungeon(92, { 
      //   dungeon_id: 11309214,
      //   fellow_user_id: null
      // })


      // getBattleInitDataForSuppressId(2028),
      

      // getBattleInitDataForEventId(94),
      // getWdayDataForEvent(518)
      // scrapeSplashScreen()
      // scrapeIndexScreen()
      
      //// GET ANNOUNCMENTS SEEN ON HOME SCREEN WHEN YOU LOGIN
      // getRootData(),



      //// NO IDEA
      // getFriendFollowModalInfo(),



      ///USELESS. RETURNS NOTHING
      // getChallengeData(92),


      // HAS USER DATA AND A TON OF DATA ABOUT THE DUNGEONS FOR THE WORLD ID PASSED.
      // WORLD IS BASICALLY AN EVENT BANNER AND YOU CAN GET THE ID FROM getWorldBattles
      // getWorldDungeonData(113092),
      
      ////// THIS SEEMS TO ONLY WORK IF YOU'RE IN THE SCREEN TO CHOOSE YOUR ROAMING WARRIOR
      // getDetailedFellowListing(),

      /// FROM WHAT I CAN TELL THIS ONLY SHOWS INFO ABOUT THE CURRENT BATTLE YOU'RE IN. A BIT MORE DETAILED THOUGH.
      /// ONLY WORKS IF YOU'RE IN A DUNGEON
      /// json.user_dungeon.name has name of dungeon json.user_dungeon.id json.user_dungeon.world_id
      /// json.battles[].name has name of battle
      /// json.user has a ton of user info
      getWorldBattles()
    ];
  })
  .spread(function() {
   // console.log(util.inspect(arguments, false, null));
  })
  .catch(console.log)
}


module.exports = {
  begin: begin,
  api: {
    authData: authData,
    getWorldBattles: getWorldBattles,
    getDetailedFellowListing: getDetailedFellowListing,
    getWorldDungeonData: getWorldDungeonData,
    getChallengeData: getChallengeData,
    getFriendFollowModalInfo: getFriendFollowModalInfo,
    getRootData: getRootData,
    getProfileData: getProfileData,
    getImages: getImages,
    getAudioFiles: getAudioFiles,
    getBattleInitDataForEventId: getBattleInitDataForEventId,
    extraFilesFromBlob: extraFilesFromBlob
  }
};