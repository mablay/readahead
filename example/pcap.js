// Parse a pcap file and a few levels of the network stack
// See: https://tools.ietf.org/id/draft-gharris-opsawg-pcap-00.html
// You'll need to install `pcap` for this to work, because we're using
// its decoding funcitonality, not its reader/parser.
// $ npm install pcap
// $ node example/pcap.js someNetworkTrace.pcap

const fs = require('fs')
const pcap = require('pcap')
const readahead = require('..')

const GLOBAL_HEADER_SIZE = 24
const PACKET_HEADER_SIZE = 16

// parse cli args
const file = process.argv[2] || (() => { throw new Error('Missing file argument!') })()

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
  // endianness depends on magic bytes in global header!
  // for this stub it's hard coded.
  const len = buf.readUInt32LE(8)
  return {
    sec: buf.readUInt32LE(0),
    usec: buf.readUInt32LE(4),
    len,
    origLen: buf.readUInt32LE(12)
  }
}

/** This is the actual example code for the pcap example */
async function pcapWithReadahead () {
  const rs = fs.createReadStream(file)
  const reader = readahead(rs)
  // read global header
  let { value } = await reader.next(GLOBAL_HEADER_SIZE)
  const fileHeader = parseGlobalHeader(value)
  console.log(fileHeader)
  while (true) {
    // read packet header
    const header = await reader.next(PACKET_HEADER_SIZE)
    if (header.done) break
    const packetHeader = parsePacketHeader(header.value)
    // read packet body
    const body = await reader.next(packetHeader.len)
    if (body.done) break
    const packet = pcap.decode.packet({
      header: header.value,
      buf: body.value,
      link_type: 'LINKTYPE_ETHERNET'
    })
    // console.log(packet)
  }
}

function pcapWithCBindings () {
  pcap.createOfflineSession(file, {})
    .on('packet', pkg => {
      const packet = pcap.decode(pkg)
    })
    .on('finish', () => console.log('DONE'))
}

pcapWithReadahead()
// pcapWithCBindings()
