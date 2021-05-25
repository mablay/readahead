var babar = require('babar')
console.log(babar([
  [1, 30],
  [2, 25],
  [3, 20],
  [4, 4],
  [5, 1]
], {
  color: 'ascii',
  width: 60,
  height: 10,
  maxY: 30,
  yFractions: 0
}))
