const _ = require('lodash');
const mongoose = require('mongoose');
const dropData = require('../dropData.js');

const schema = new mongoose.Schema({
	denaBattleId: { type: String },
	denaDungeonId: { type: String },
	eventId: { type: String },
	eventType: { type: String },
	realm: { type: String },  //categorize the FF realm...aka ff1, ff5, ff13
	dungeonName: { type: String },
	battleName: { type: String },  //part1, part2, part 3 boss stage etc...
	stamina: { type: Number },  //with this we can compute the orb/stam ratio...not sure where to get it
	dropRates: mongoose.Schema.Types.Mixed,
	drops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }]
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
					dropImg: dropImg,
					dropName: dropData[itemId],
					rarity: info.rarity
				})
			}
		})
	})

	//itemsFound = _.sortBy(itemsFound, [function(o) { return -o.rarity; }]); //will take extra db calls to get rarity :(

	return itemsFound;
}

schema.statics.getDungeonList = function(cb) {
	//todo: add paging, this will get huge
	mongoose.model('Battle', schema).aggregate([
		{ '$sort': { 'denaDungeonId': 1 } },  //this will display the newest events first?
		{
			$group: {
				_id: '$denaDungeonId',
				dungeonName: { $first: '$dungeonName' },
				eventType: { $first: '$eventType' },
				dropRates: { $push: '$dropRates' }
			}
		}
	], function(err, result) {
		_.each(result, function(dungeon) {
			dungeon.itemsFound = getUniqueItemsFromDungeon(dungeon);
		})

		cb(err, result)
	});
}

schema.statics.getBattleList = function(denaDungeonId) {
  return mongoose.model('Battle').find({ denaDungeonId: denaDungeonId }).sort([['denaDungeonId', 'descending']]).populate("drops")
  .then((battles) => {
    battles.forEach((battle) => {
      battle.uniqueDrops = _.uniqBy(battle.drops, (drop) => { return drop.denaItemId; });

      battle.uniqueDrops.forEach((drop) => {
        drop.imgUrl = GetDropImg(drop.denaItemId);
        drop.name = dropData[drop.denaItemId];
        drop.hits = battle.dropRates[drop.denaItemId].hits;
        drop.total = battle.dropRates[drop.denaItemId].total;
        drop.rate = battle.dropRates[drop.denaItemId].rate ? Math.round(battle.dropRates[drop.denaItemId].rate * 100) : 0;
      });

      battle.itemsFound = battle.uniqueDrops.length > 0;
    });

    return battles;

  });
}

module.exports = mongoose.model('Battle', schema);