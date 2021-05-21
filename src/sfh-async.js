const { Writable, Readable } = require('stream')

const CACHE_SIZE = 16 * 65536

function streamParser ({ cacheSize = CACHE_SIZE } = {}) {
  // const writableHighWaterMark = Math.ceil(cacheSize / 65536)
  const chunks = []
  let cachedBytes = 0
  let offset = 0

  let finished = false
  let eofSignaled = false

  // Construct the default response once the end
  // of the stream has been reached.
  // bytesRead: 0 indicates End-Of-Stream to the reader
  function eosResponse () {
    if (eofSignaled) throw new Error('Read after end of file has been signaled!')
    eofSignaled = true
    return {
      bytesRead: 0,
      buffer: Buffer.alloc(0)
    }
  }

  const readQueue = [] // [{ size, cb }] // reader queue
  const writeQueue = [] // [{ resolve, reject }] // writer queue

  // called by reader
  function setNextReadRequest (size, cb) {
    if (writeQueue.length) {
      //writer gets the read request he was waiting for
      writeQueue.shift().resolve({ size, cb })
    } else {
      // shelf the request
      readQueue.push({ size, cb })
    }
  }

  // called by writer
  /** @returns Promise<{ size, cb }> */
  function getNextReadRequest () {
    if (readQueue.length) {
      // directly return the read request
      return readQueue.shift()
    } else {
      // writer has to wait for readers next read request
      return new Promise((resolve, reject) => {
        writeQueue.push({ resolve, reject })
      })
    }
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
          if (size > cacheSize) {
            throw new Error('Requested bytes exceed cache size!')
          }
          readQueue.unshift({ size, cb })
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
    if (readQueue.length) {
      // resolve the last read request with an EndOfStream response
      if (cachedBytes > 0) {
        // flush
        const firstSlice = chunks.shift().slice(offset)
        offset = 0
        const buffer = Buffer.concat([firstSlice, ...chunks])
        cachedBytes = 0
        const bytesRead = buffer.byteLength
        readQueue.shift().cb(null, { bytesRead, buffer })
      } else {
        // end
        readQueue.shift().cb(null, eosResponse())
      }
    }
  })

  sfh.read = function read (size) {
    if (finished) {
      return Promise.resolve(eosResponse())
    }
    return new Promise((resolve, reject) => {
      setNextReadRequest(size, (err, buf) => {
        // console.log({ cachedBytes, readQueue: readQueue.length, writeQueue: writeQueue.length })
        if (err) reject(err)
        else resolve(buf)
      })
    })
  }

  return sfh
}

module.exports = streamParser
