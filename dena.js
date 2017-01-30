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
const request = require('request');
const rp = require('request-promise');
const Promise = require('bluebird');
const util = require('util');
const lodash = require('lodash');
const readFile = Promise.promisify(require("fs").readFile);



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

		var options = {
			url: 'http://ffrk.denagames.com/dff/_api_create_session',
		  proxy: process.env.PROXY_URL,
		  headers: {
			  'Content-Type': 'application/x-www-form-urlencoded',
			  //'Content-Length': Buffer.byteLength(post_data)  //pretty sure request does this for us
		  }
		};

		request.post(options, post_data, function(err, data, headersMightBeHere) {
      var sessionId = null;

      data.rawHeaders.forEach((header) => {   //todo fix this
        if(header.match(/http_session_sid=/)) {
          sessionId = header.match(/http_session_sid=([^;]+)/)[1];
        }
      });
      resolve(sessionId);
		})


  });
}

function getBrowserData(sessionId) {
  return new Promise(function(resolve, reject) {
    request.get({
        url: 'http://ffrk.denagames.com/dff/',
		    proxy: process.env.PROXY_URL,
        headers: {
          'Cookie': 'http_session_sid='+sessionId
        }
    }, function(err, data, dataAsStr) {
			var matchData = dataAsStr.match(/FFEnv\.csrfToken="([^"]+)";/);

        if(!matchData) {
          reject({
            message: "invalid session id",
            name: "Authorization Error"
          });

          return;
        }

		    var beginBattleToken;
        var csrfToken = matchData[1];

				var found = dataAsStr.match(/"begin_battle_token":"([^"]+)"/);
			  if (found && found[1]) {
					beginBattleToken = found[1];
				}

        resolve({
          csrfToken: csrfToken,
          beginBattleToken: beginBattleToken
        });  
    });
  });
}

function scrapeSplashScreen() {
  return new Promise(function(resolve, reject) {
    request.get({
			  url: 'http://ffrk.denagames.com/dff/splash',
		    proxy: process.env.PROXY_URL
    }, function(err, data) {
			resolve(data);
    });	
  });
}

function scrapeIndexScreen(sessionId) {
  sessionId = sessionId;
  return new Promise(function(resolve, reject) {
    request.get({
			  url: 'http://ffrk.denagames.com/dff/',
		    proxy: process.env.PROXY_URL,
        headers: {
          'Cookie': 'http_session_sid='+sessionId
        }
    }, function(err, data) {
        resolve(data);
    });
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

function getJsonBlobs(sessionId) {
  return (process.env.IS_TEST ? readFile("./scrapes/index.html", "utf8") : scrapeIndexScreen(sessionId))
  .then((data) => {
    data = data.toString();
    data = data.replace(/,"dungeon_status_summary":\{\}/g,"")
    data = data.replace(/,"dungeon_status_summary":\{[\}\}]+\}\}/g,"")
    data = data.replace(/,"dungeon_term_list":\[[^\]]+\]/g,"")
    data = data.replace(/,"dungeon_term_list":null/g,"")
    
    var embeddedJsonBlobs = /(?:"bgm":"([^"]+)",)?"door_image_path":"([^"]+)","series_formal_name":"([^"]+)","id":(\d+),"name":"([^"]+)","has_new_dungeon":([^,]+),"series_id":(\d+),"opened_at":(\d+),"kept_out_at":(\d+),"is_unlocked":(true|false),"image_path":"([^"]+)","type":(\d+),"banner_message":"([^"]*)"/g.execAll(data);

    return embeddedJsonBlobs;
  });
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
    request.post({
			  url: 'http://ffrk.denagames.com/dff/update_user_session',
		   	proxy: process.env.PROXY_URL,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': 'http_session_sid='+sessionId
        }
    }, post_data, function(err, res, data) {
			try {
				var json = JSON.parse(data);
        resolve(json.user_session_key);
			} catch (e) {
				reject({
					message: "invalid session id",
					name: "Authorization Error"
				});
			}       
    });
  });
}

function doSimplePost(path, json, options) {
  options = options || {}

  var sessionId = options.sessionId;
  var userSessionKey = options.userSessionKey;
  var csrfToken = options.csrfToken;

  var headers =  {
    'Content-Type': 'application/json',
    'Cookie': 'http_session_sid='+sessionId,
    'User-Session': userSessionKey,
    'X-CSRF-Token': csrfToken
  }

  return new Promise(function(resolve, reject) {
    var post_data = JSON.stringify(json);

    request.post({
			  url: 'http://ffrk.denagames.com/' + path,
		   	proxy: process.env.PROXY_URL,
        headers: headers
    }, post_data, function(err,data) {
				try {
					var json = JSON.parse(data);
					resolve(json);
				} catch(e) {
					reject({
            message: "invalid session id",
            name: "Authorization Error"
          });
				}
    });
  });
}

function doSimpleGet(path, options) {
  options = options || {}
  var sessionId = options.sessionId;
  var userSessionKey = options.userSessionKey;

  var headers =  {
    'Content-Type': 'application/json',
    'Cookie': 'http_session_sid='+sessionId
  }

  if(userSessionKey) {
    headers['User-Session'] = userSessionKey;
  }

  return new Promise(function(resolve, reject) {
    request.get({
		  	url: 'http://ffrk.denagames.com/' + path,
		   	proxy: process.env.PROXY_URL,
        headers: headers
    }, function(data) {
        try {
          var json = JSON.parse(data);   
        } catch(e) {
          reject({
            message: "invalid session id",
            name: "Authorization Error"
          });
        }
    });
  });
}

function doEnterDungeon(challengeId, dungeonId, options) {
  return doSimplePost("/dff/event/challenge/"+challengeId+"/enter_dungeon", {dungeon_id: dungeonId}, options);
}

function doLeaveDungeon(challengeId, dungeonId, options) {
  return doSimplePost("/dff/event/challenge/"+challengeId+"/leave_dungeon", {dungeon_id: dungeonId}, options);
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

function getFolloweeAndFollowersData(options) {
  return doSimplePost("/dff/relation/followee_and_follower_list", {}, options);
}

function doGachaDraw(options) {
  return doSimplePost("/dff/gacha/execute", {entry_point_id: 16008101}, options);
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


module.exports = {
  api: {
    doEnterDungeon: doEnterDungeon,
    doLeaveDungeon: doLeaveDungeon,
    doGachaDraw: doGachaDraw,
    getJsonBlobs: getJsonBlobs,
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
    extraFilesFromBlob: extraFilesFromBlob,
    getFolloweeAndFollowersData: getFolloweeAndFollowersData
  }
};