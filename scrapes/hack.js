///hack - work in progression to decrypt how battle results are sent. Most of this is picked apart from the various .js files in the /scrapes director

decryptTextDeferred: function(e) {
    var t = this,
        n = $.Deferred();
    return kickmotor.nativefn.Edea(e, function(e) {
        var r = e.result;
        t.isClientAesKeyClientVersion() && (r = decodeURIComponent(r)), n.resolve(r)
    }), n.promise()
},


C = function(e, t) {
  280 <= H() ? D() ? _() == "android" ? C = function(e, t) {
      var n = e + JSON.stringify(t || {});
      l < i ? (l++, c(b + n)) : y.push(n)
  } : C = function(e, t) {
      y.push(e + JSON.stringify(t || {})), !1 === n && f.attr("src", "nativefn://pump")
  } : C = function(e, t) {} : C = function(e, t) {
      if (D()) {
          t = t || {};
          var n = e + JSON.stringify(t);
          _() === "android" ? c("nativefn:" + n) : (y.unshift(n), y.length === 1 && f.attr("src", "nativefn://call"))
      }
  }, C(e, t)
},

C = function(e, t) {
  t = t || {};
  var n = e + JSON.stringify(t);
  (y.unshift(n), y.length === 1 && f.attr("src", "nativefn://call"))
}

function k(e, t) {
  C(e, t);
}

k("Ultimecia", {
	text: e,
	callback: n
})

function mt(e, t) {
    e = typeof e == "string" ? e : "";
    var n = T(t);
    k("Edea", {
        text: e,
        callback: n
    })
}



function P(e) {
  var t;
  return (t = (new RegExp("(?:^|; )" + encodeURIComponent(e) + "=([^;]*)")).exec(document.cookie)) ? t[1] : ""
}

function H() {
   return parseInt(P("ci_appversion"), 10)
}

function decrypt(text, obj) {
	var hash = text + JSON.stringify(obj);
	
	y.unshift(hash);

	if(y.length === 1) {
		f.attr("src", "nativefn://call")
	}
}

decrypt("Edea", {text: "<battle results>", callback: console.log})

function makeBuddyResultData() {
    var data = {};
    
    _.each(FF.ns.battle.ActorMgr.getAllBuddies(), function(buddy) {
        var buddyParam = FF.ns.battle.BattleInfo.getInstance().getActorParam(buddy.getUid());

        var buddyData = {
            hp: _.min([buddy.get("hp"), buddyParam.maxHp]),
            sa: buddy.statusAilments.getContinuanceIds()
        };

        _.each(FF.ns.battle.Config.getInstance().get("DefaultAbilityPanels"), function(id, index) {
          var receptor = buddy.getReceptorById(id);

          if (!receptor || !receptor.isCommandPanel()) return;

          buddyData["panel" + index] = receptor.isInfinity() ? null : _.min([receptor.get("remainNum"), receptor.get("defaultMaxNum")])

        });

        buddyData.ss_gauge = buddy.getSoulStrike().get("point");

        data[buddy.get("no")] = buddyData;

    });

    var supporterData = {
    	supporter_ss_gauge: 0
		}

    var supporter = FF.ns.battle.ActorMgr.getSupporter();

    if (supporter) {
			var i = supporter.getSupporterSoulStrike().get("restCount");
      supporterData.supporter_ss_gauge = i;
    }

    return {
      buddy: data,
			supporter: supporterData
    }
}

_makeWinResult: function() {
    var e = makeBuddyResultData();

    e.score = r.Score.makeResultData();
    e.log = r.BattleLog.makeResultData();
    e.initChkResult = r.BattleInfo.getInstance().getBattleInitData().initChkResult ? 1 : 0;
    e.initChkResultText = r.BattleInfo.getInstance().getBattleInitData().initChkResultText
    e.session_key = r.BattleInfo.getInstance().getAppInitDataSessionKey()

    this._setParameterSnapshot(e)

    var mockData = {
    	supporter: {
    		supporter_ss_gauge: 0
    	},
    	buddy: {
    		'1': {
    			ss_gauge: 0,
    			hp: 3111,
    			sa: []
    		}
    	}
    }

    return e;
},


function battleWinDeferred(encryptedWinResults, options) {
	var endPoint = '/dff/event/challenge/92/win_battle'

	return _psuedoDoPost(endPoint, {
		results: encryptedWinResults
	});
}

function doWinBattle() {
	var winResults = _makeWinResult();
	var stringifiedWinResults = JSON.stringify(winResults);

	kickmotor.nativefn.Ultimecia(stringifiedWinResults, function(e) {
		battleWinDeferred(e.result, {
			retryCount: 1
	  });
	})
