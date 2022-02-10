// --- encoding ---
import readahead from "../../index.js"

// header only contains payload length as number
const header = {
  byteLength: 4,
  decode (buffer) {
    return buffer.readUInt32BE()
  },
  encode (byteLength) {
    const buffer = Buffer.alloc(4)
    buffer.writeUInt32BE(byteLength)
    return buffer
  }
}

// payload contains utf8 encoded json string
const payload = {
  encode (obj) {
    return Buffer.from(JSON.stringify(obj))
  },
  decode (buffer) {
    return JSON.parse(buffer.toString())
  }
}

/** length prefixed json Generator
 * will yield a 4 byte big endian length prefix
 * then the utf8 encoded json string
 * count times.
 * @param {number} count 
 */
function * lpjGenerator (count = 10) {
  for (let i = 1; i <= count; i++) {
    const obj = {
      lorem: 'ipsum',
      index: i
    }
    const buffer = payload.encode(obj)
    yield header.encode(buffer.byteLength)
    yield buffer
  }
}

// repackages lpj buffers into buffers of fixed size
// to obfuscate native buffer segmentation.
export async function * lpjSerialiser (count, chunkSize = 65536) {
  const source = lpjGenerator(count)
  const reader = readahead(source)
  while (true) {
    const { value, done } = await reader.next(chunkSize)
    if (done) break
    yield value
  }
}

/** 
 * This is the actual example code.
 * See how the reader is used to access
 * the next bytes in the sequence.
 * Then you decode the buffers using your
 * own encoding schema and yield the parsed
 * payload
 */
export async function * lpjParser (reader) {
  while (true) {
    const head = await reader.next(header.byteLength)
    if (head.done) break
    const len = header.decode(head.value)
    const body = await reader.next(len)
    if (body.done) break
    yield payload.decode(body.value)
  }
}
