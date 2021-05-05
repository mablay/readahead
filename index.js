const { Transform } = require('stream')

const CACHE_SIZE = 16 * 65536

function streamParser (parser) {
  const chunks = []
  let cachedBytes = 0
  let offset = 0
  let buf

  // returns buffer or undefined
  function consume () {
    const size = parser.expect()
    if (size > cachedBytes) {
      if (size > CACHE_SIZE) {
        throw new Error('Requested bytes exceed cache size!')
      }
      return
    }
    const slices = []
    let consumed = 0
    while (consumed !== size) {
      const ubound = offset + size - consumed
      const buf = chunks[0].slice(offset, ubound)
      consumed += buf.byteLength
      slices.push(buf)
      if (offset + buf.byteLength === chunks[0].byteLength) {
        chunks.shift()
        offset = 0
      } else {
        offset += buf.byteLength
      }
    }
    const buf = (slices.length === 1) ? slices[0] : Buffer.concat(slices)
    cachedBytes -= size
    return buf
  }

  return new Transform({
    readableObjectMode: true,
    transform (chunk, enc, next) {
      chunks.push(chunk)
      cachedBytes += chunk.byteLength
      while (buf = consume()) {
        const msg = parser.parse(buf)
        if (msg) this.push(msg)
      }
      next()
    }
  })
}

module.exports = streamParser
