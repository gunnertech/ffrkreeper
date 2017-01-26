const _ = require('lodash');
const mongoose = require('mongoose');
const dropData = require('../dropData.js');
const Promise = require('bluebird');

const dungeonsPerPage = 12;

const schema = new mongoose.Schema({
	denaBattleId: { type: String, index: true },
	denaDungeonId: { type: String, index: true },
	eventId: { type: String, index: true },
	eventType: { type: String },
	realm: { type: String },  //categorize the FF realm...aka ff1, ff5, ff13
	dungeonName: { type: String },
	battleName: { type: String },  //part1, part2, part 3 boss stage etc...
	stamina: { type: Number },  //with this we can compute the orb/stam ratio...not sure where to get it
	dropRates: mongoose.Schema.Types.Mixed,
	drops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }],
  enemies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enemy' }]
});

function GetDropImg(itemId) {
	var dropName = dropData[itemId]
	if(!dropName) return 'https://placeholdit.imgix.net/~text?txtsize=50&txt=%3F&w=112&h=112&txttrack=0';

	if(dropName.match(/Orb/) || dropName.match(/Crystal/)) {
		return 'https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/ability_material/' + itemId + '/' + itemId + '_112.png';
	} else {
		return 'https://ffrk.static.denagames.com/dff/static/lang/ww/compile/en/image/common_item/' + itemId + '.png';
	}
}

function getUniqueItemsFromDungeon(dungeon) {
	var itemsFound = []

	_.each(dungeon.dropRates, function(drop) {
		_.each(drop, function(info, itemId) {
			if(!_.includes(itemsFound, itemId)) {
				var dropImg = GetDropImg(itemId);
				if(dropImg === 'https://placeholdit.imgix.net/~text?txtsize=50&txt=%3F&w=112&h=112&txttrack=0') return;//don't display default image here

				itemsFound.push({
					itemId: itemId,
					imgUrl: dropImg,
					name: dropData[itemId],
					rarity: info.rarity
				})
			}
		})
	})

	//itemsFound = _.sortBy(itemsFound, [function(o) { return -o.rarity; }]); //will take extra db calls to get rarity :(

	return itemsFound;
}

schema.statics.getDungeonList = function(pageNumber, cb) {
	mongoose.model('Battle', schema).aggregate([	
		{
			$group: {
				_id: '$denaDungeonId',
				dungeonName: { $first: '$dungeonName' },
				eventType: { $first: '$eventType' },
				dropRates: { $push: '$dropRates' },
				enemies: { $push: '$enemies' }
			}
		},
		{ $sort: { 'denaDungeonId': 1 } }, 
	  { $skip: dungeonsPerPage * pageNumber },
		{ $limit: dungeonsPerPage }
	], function(err, result) {
		_.each(result, function(dungeon) {
			dungeon.uniqueDrops = getUniqueItemsFromDungeon(dungeon);
			//dungeon.enemiesStr = _.map((dungeon.enemies || []), 'name').join(', ');
		})

		cb(err, result)
	});
}

schema.statics.getBattleList = function(denaDungeonId) {
  return mongoose.model('Battle').find({ denaDungeonId: denaDungeonId }).sort([['denaDungeonId', 'descending']]).populate(["enemies"]).select("-drops")
  .then((battles) => {
    return Promise.map(battles, (battle) => {
      return mongoose.model('Drop').find({battle: battle._id}).distinct('denaItemId')
      .then((denaItemIds) => {
        battle.uniqueDrops = [];
        battle.name = _.map((battle.enemies||[]), 'name').join(', ') || battle.denaBattleId;

        denaItemIds.forEach((denaItemId) => {
          var drop = {};
          drop.imgUrl = GetDropImg(denaItemId);
          drop.name = dropData[denaItemId];
          drop.hits = battle.dropRates[denaItemId] ? battle.dropRates[denaItemId].hits : 0;
          drop.total = battle.dropRates[denaItemId] ? battle.dropRates[denaItemId].total : 0;
          drop.rate = battle.dropRates[denaItemId] ? (battle.dropRates[denaItemId].rate ? Math.round(battle.dropRates[denaItemId].rate * 100) : 0) : 0;
          battle.uniqueDrops.push(drop);
        });

        battle.itemsFound = battle.uniqueDrops.length > 0;

        return battle;
      });  
    })
    .return(battles);
  });
}

module.exports = mongoose.model('Battle', schema);