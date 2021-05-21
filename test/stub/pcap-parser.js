// more complex example for encoded data

function createParser () {
  let currentHeader
  let globalHeader

  function parseGlobalHeader (buf) {
    globalHeader = {
      magicNumber: buf.readUInt32LE(0),
      versionMajor: buf.readUInt16LE(4),
      versionMinor: buf.readUInt16LE(6),
      zone: buf.readUInt32LE(8),
      sigfigs: buf.readUInt32LE(12),
      snaplen: buf.readUInt32LE(16),
      network: buf.readUInt32LE(20)
    }
    return {
      nextParser: parsePacketHeader,
      message: null
    }
  }
  parseGlobalHeader.bufferSize = 24
  
  function parsePacketHeader (buf) {
    const len = buf.readUInt32LE(8)
    currentHeader = {
      sec: buf.readUInt32LE(0),
      usec: buf.readUInt32LE(4),
      len,
      origLen: buf.readUInt32LE(12)
    }
    parsePacketBody.bufferSize = len
    return {
      nextParser: parsePacketBody,
      message: null
    }
  }
  parsePacketHeader.bufferSize = 16
  
  function parsePacketBody (buf) {
    return {
      nextParser: parsePacketHeader,
      message: {
        header: currentHeader,
        body: buf
      }
    }
  }
  

  let parser = parseGlobalHeader

  return {
    parse: (buf) => {
      const { nextParser, message } = parser(buf)
      parser = nextParser
      return message
    },
    expect: () => parser.bufferSize,
    get fileHeader () {
      return globalHeader
    }
  }
}

module.exports = createParser
