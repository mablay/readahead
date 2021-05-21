const { Writable, Readable } = require('stream')

const CACHE_SIZE = 16 * 65536

function streamParser () {
  const chunks = []
  let cachedBytes = 0
  let offset = 0

  let finished = false
  const nrrs = [] // [{ size, cb }] // reader queue
  const nrqs = [] // [{ resolve, reject }] // writer queue

  // called by reader
  function setNextReadRequest (size, cb) {
    // console.log('setNextReadRequest | nrrs', nrrs.length, 'nrqs', nrqs.length)
    if (nrqs.length) {
      // writer is already waiting for the read request
      // console.log('reader dequeues buffer')
      nrqs.shift().resolve({ size, cb })
    } else {
      // shelf the request
      // console.log('reader awaits data from writer')
      nrrs.push({ size, cb })
    }
  }

  // called by writer
  /** @returns Promise<{ size, cb }> */
  function getNextReadRequest () {
    // console.log('getNextReadRequest | nrrs', nrrs.length, 'nrqs', nrqs.length)
    if (nrrs.length) {
      // directly return the read request
      // console.log('writer dequeues read request')
      return nrrs.shift()
    }
    // console.log('writer awaits next read request')
    return new Promise((resolve, reject) => {
      nrqs.push({ resolve, reject })
    })
  }
  
  const sfh = new Writable({
    writableObjectMode: false,
    async write (chunk, enc, next) {
      // console.log('writeable | write', chunk.length)
      chunks.push(chunk)
      cachedBytes += chunk.byteLength
      while (true) {
        // if (finished) {
        //   next()
        //   break
        // }

        const { size, cb } = await getNextReadRequest()
        if (size > cachedBytes) {
          if (size > CACHE_SIZE) {
            throw new Error('Requested bytes exceed cache size!')
          }
          nrrs.unshift({ size, cb })
          break
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

        cb(null, { bytesRead: buf.byteLength, buffer: buf })
      }
      next()
    }
  })

  sfh.on('finish', () => {
    finished = true
    if (nrrs.length) {
      nrrs.shift().cb(null, { bytesRead: 0, buffer: Buffer.alloc(0) })
    }
  })

  sfh.hasFinished = () => finished

  sfh.read = async function read (size) {
    if (finished) throw new Error('Done')
    return new Promise((resolve, reject) => {
      setNextReadRequest(size, (err, buf) => {
        if (err) reject(err)
        else resolve(buf)
      })
    })
  }

  return sfh
}

module.exports = streamParser
