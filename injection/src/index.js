import getEnemyParams from './getEnemyParams';
import getBuddyParams from './getBuddyParams';
import getBattleInitData from './getBattleInitData';
import startDropTracker from './startDropTracker';

const hijackBattleInfo = bi => {
  getEnemyParams(bi);
  getBuddyParams(bi);
  getBattleInitData(bi);
}

const hijackBattleInitData = bid => {
  startDropTracker(bid);
}

const battleInfoInterval = setInterval(() => {
  try {
    hijackBattleInitData(FF.ns.battle.BattleInitData);
    clearInterval(battleInfoInterval);
  } catch (e) { }
}, 3000);

const battleInitDataInterval = setInterval(() => {
  try {
    hijackBattleInfo(FF.ns.battle.BattleInfo.getInstance());
    clearInterval(battleInitDataInterval);
  } catch (e) { }
}, 3000);

const castTimeTimer = setInterval(() => {
  try {
    FF.ns.battle.ActorBase.prototype.getCastTime = () => 0;
    clearInterval(castTimeTimer);
  } catch (e) { }
}, 3000);

if (module.hot) {
  module.hot.accept('./items.js', () => console.log('Accepting the updated printMe module!'));
}