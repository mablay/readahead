const sfReader = require('..')
const fs = require('./stub/fs.stub')

module.exports = t => {
  const rs = fs.createReadStream()
  const fh = sfReader.fromStream(rs)
  fh.read()
  t.ok(true)
}