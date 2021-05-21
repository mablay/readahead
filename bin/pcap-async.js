const streamParser = require('../src/sfh-async')
const fs = require('fs')

const GLOBAL_HEADER_SIZE = 24
const PACKET_HEADER_SIZE = 16

main().catch(console.error)
async function main () {
  const rs = fs.createReadStream('trace.pcap')
  const sfh = streamParser()
  rs.pipe(sfh)
  let res = await sfh.read(GLOBAL_HEADER_SIZE)
  const fileHeader = parseGlobalHeader(res.buffer)
  console.log(fileHeader)
  while (true) {
    let { bytesRead, buffer } = await sfh.read(PACKET_HEADER_SIZE)
    if (bytesRead === 0) break
    const packetHeader = parsePacketHeader(buffer)
    // console.log(packetHeader)
    Object.assign({ bytesRead, buffer }, await sfh.read(packetHeader.len))
    // console.log(buf)
  }
  // sfh.read() // throws Error (as expected)
  console.log('main | close')
}

// 24 bytes
function parseGlobalHeader (buf) {
  return {
    magicNumber: buf.readUInt32LE(0),
    versionMajor: buf.readUInt16LE(4),
    versionMinor: buf.readUInt16LE(6),
    zone: buf.readUInt32LE(8),
    sigfigs: buf.readUInt32LE(12),
    snaplen: buf.readUInt32LE(16),
    network: buf.readUInt32LE(20)
  }
}

function parsePacketHeader (buf) {
  const len = buf.readUInt32LE(8)
  return {
    sec: buf.readUInt32LE(0),
    usec: buf.readUInt32LE(4),
    len,
    origLen: buf.readUInt32LE(12)
  }
}
