const { Readable } = require('stream')

const defaultLength = 65536 * 20
function getLength (start, end) {
  if (end === undefined) return defaultLength
  start = start || 0
  return Math.max(0, end - start)
}


function mnemonicAlloc () {
  let buffer = Buffer.alloc(65536)
  return function getBuffer (size) {
    if (buffer.byteLength !== size) {
      buffer = Buffer.alloc(size)
    }
    return buffer
  }
}

function createReadStream (path, { start, end } = {}) {
  const len = getLength(start, end)
  let bytesRead = 0
  const getBuffer = mnemonicAlloc()
  return new Readable({
    read (size) {
      // console.log('[fs.stub] READ', size)
      if (bytesRead === len) return this.push(null)
      if (bytesRead + size > len) size = len - bytesRead
      bytesRead += size
      this.push(getBuffer(size))
    }
  })
}

module.exports = {
  createReadStream
}
