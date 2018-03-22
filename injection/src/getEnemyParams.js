export default (bi) => {
  bi.getEnemyParams = () => (
    bi._enemies.map(enemy => Object.assign(enemy, {
      initHp: 1, 
      maxHp: 1,
      params: enemy.params.map(param => Object.assign(param, {
        atk: 1,
        mdef: 1,
        lv: 1,
        acc: 1,
        def: 1,
        eva: 1,
        exp: 1,
        spd: 1,
        maxHp: 1,
        mnd: 1
      }))
    }))
  )
}