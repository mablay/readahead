const fs = require('fs')
const readahead = require('../src/readahead')
const {
  GLOBAL_HEADER_SIZE,
  PACKET_HEADER_SIZE,
  parseGlobalHeader,
  parsePacketHeader
} = require('../test/stub/pcap')

main().catch(console.error)
async function main () {
  const rs = fs.createReadStream('trace.pcap')
  const reader = readahead()
  rs.pipe(reader)
  let buf = await reader.read(GLOBAL_HEADER_SIZE)
  const fileHeader = parseGlobalHeader(buf)
  console.log(fileHeader)
  while (true) {
    let buffer = await reader.read(PACKET_HEADER_SIZE)
    if (buffer.byteLength === 0) break
    const packetHeader = parsePacketHeader(buffer)
    // console.log(packetHeader)
    buffer = await reader.read(packetHeader.len)
    // console.log(buf)
  }
  // sfh.read() // throws Error (as expected)
  console.log('main | close')
}
