const fs = require('fs')
const { Readable } = require('stream')

const file = process.argv[2] || 'test.dat'

function createPayload (min = 10, max = 1000) {
  const size = Math.floor(min + Math.random() * (max - min))
  return Buffer.alloc(size, 0xFF)
}

function createHeader (size) {
  const buf = Buffer.alloc(4)
  buf.writeUInt32BE(size)
  return buf
}

function createMsg () {
  const body = createPayload()
  const size = body.byteLength
  const header = createHeader(size)
  return Buffer.concat([header, body])
}

function * msgGenerator (size) {
  let bytes = 0
  while (bytes < size) {
    const buf = createMsg()
    bytes += buf.byteLength
    // console.log(bytes)
    yield buf
  }
}

const rs = Readable.from(msgGenerator(1e9))
const ws = fs.createWriteStream(file)
rs.pipe(ws)
