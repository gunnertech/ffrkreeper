export default (bi) => {
  bi.getBuddyParams = () => (
    bi._battleInitData.battle.buddy.map(buddy => Object.assign(buddy, {
      initHp: 99999,
      maxHp: 99999,
      soulStrikeGauge: 3500,
      params: buddy.params.map(param => Object.assign(param, {
        atk: 9999,
        mdef: 9999,
        level: 99,
        acc: 9999,
        def: 9999,
        eva: 9999,
        spd: 9999,
        maxHp: 9999,
        matk: 9999,
        mnd: 9999
      }))
    }))
  )
}