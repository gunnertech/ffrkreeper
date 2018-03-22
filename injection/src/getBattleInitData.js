export default (bi) => {
  bi.getBattleInitData = () => (
    Object.assign(bi._battleInitData, {
      battle: Object.assign(bi._battleInitData.battle, {
        initialAtbType: 2,
        showTimerType: 1
      })
    })
  )
}