const fs = require('./stub/fs.stub')

function testReadStream (t, len, options) {
  let count = 0
  return new Promise ((resolve, reject) => {
    fs.createReadStream('', options)
      .on('data', data => count += data.byteLength)
      .on('end', () => {
        t.equal(count, len, 'all bytes read')
        resolve()
      })
      .on('error', reject)
  })
}

module.exports = t => {
  return Promise.all([
    testReadStream(t, 65536 * 20),
    testReadStream(t, 100000, { start: 300000, end: 400000})
  ])
}