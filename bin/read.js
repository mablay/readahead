const { streamParser } = require('..')
// const fs = require('../test/stub/fs.stub')
const fs = require('fs')

function createParser () {
  let bytes = 0
  const headerSize = 4
  function headerParser (buf) {
    return buf.readUInt32BE()
  }
  function bodyParser (buf) {
    bytes += buf.byteLength
    return { n: bytes }
  }
  let expectBytes = null
  return {
    expect: () => (expectBytes === null) ? headerSize : expectBytes,
    parse: (buf) => {
      if (expectBytes === null) {
        expectBytes = headerParser(buf)
        return {
          type: 'header',
          size: expectBytes
        }
      }
      expectBytes = null
      return {
        type: 'body',
        body: bodyParser(buf)
      }
    }
  }
}

// const rs = fs.createReadStream('', { end: 1e9 })
const rs = fs.createReadStream('test.dat')
const parser = createParser()
rs.pipe(streamParser(parser))
  .on('data', data => {
    // data.body && console.log(data)
  })
  .on('end', () => console.log('END'))
  .on('error', console.error)
