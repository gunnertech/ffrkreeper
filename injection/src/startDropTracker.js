import showMessage from './showMessage';
import flattenArray from './flattenArray';
import items from './items';

export default (bi) => {
  const dropItems = [];
  let _oldGet = bi.prototype.get;
  let timesRan = 0;

  const dropMessageInterval = setInterval(() => {
    const responses = flattenArray(dropItems).map(drop =>
      showMessage(
        JSON.stringify(
          Object.assign(
            drop, {
              item_name: (items.find(item => item.id.toString() === drop.item_id.toString()) || {}).name
            }
          )
        )
      )
    );

    timesRan++;
    if(timesRan > 2) {
      clearInterval(dropMessageInterval);
    }
  }, 2000);

  bi.prototype.get = function(e, t) {
    const data = _oldGet.call(this, e, t);

    if (data.battle.rounds) {
      data.battle.rounds.forEach(round => {
        if (round.drop_item_list && round.drop_item_list.length) {
          dropItems.push(round.drop_item_list);
        }

        if (round.enemy) {
          round.enemy.forEach(enemy => {
            if (enemy.children) {
              enemy.children.forEach(child => {
                dropItems.push(child.drop_item_list);
              });
            }
          });
        }

      });
    }

    return data;
  };
}