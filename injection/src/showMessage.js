export default (message) => {
  try {
    if(message) {
      FF.ns.battle.BattleViewController.getInstance().showMessage({ message });
      return true;
    } else {
      return false;
    }
  } catch(e) {}
}