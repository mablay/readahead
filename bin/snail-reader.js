const fsp = require('fs').promises
const createParser = require('../test/stub/pcap-parser')
const parser = createParser()

snailParser('trace.pcap', parser)
async function snailParser (file, parser) {
  const fh = await fsp.open(file)
  const { size: fileSize } = await fh.stat()
  let cursor = 0
  while (true) {
    const size = parser.expect()
    const buf =  Buffer.alloc(size)
    await fh.read(buf, 0, size, cursor)
    cursor += size
    const msg = parser.parse(buf)
    if (msg) {
      // console.log(msg)
    }
    if (cursor === fileSize) break
  }
  fh.close()
}
