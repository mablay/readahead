const { lpjSerialiser, lpjParser } = require('../test/stub/lpjson-encoding')
const readahead = require('..')

module.exports = t => {
  t.test('read length prefixed json', async t => {
    const count = 10
    const chunkSize = 5
    const source = lpjSerialiser(count, chunkSize)
    const reader = readahead(source)
    const parser = lpjParser(reader)
    let i = 1
    for await (const obj of parser) {
      t.equal(obj.lorem, 'ipsum')
      t.equal(obj.index, i++)
    }
    t.equal(i, count + 1)
  })
}
