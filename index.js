/**
 * Creates an async iterable that optionally lets you decide how many
 * bytes you'd like to receive with each iteration. Default 65536
 * @param {Iterable} readable A binary stream or iterable yielding buffers.
 * @returns {Iterable}
 */
async function * readerGenerator (readable) {
  const chunks = []
  let cachedBytes = 0 // number of bytes left to read in chunks[]
  let offset = 0 // byte offset in first chunk
  let bytes = yield

  for await (const chunk of readable) {
    chunks.push(chunk)
    cachedBytes += chunk.byteLength
    bytes = bytes || cachedBytes

    while (bytes <= cachedBytes) {
      const slices = []
      let consumed = 0
      while (consumed !== bytes) {
        const ubound = offset + bytes - consumed
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
      const buf = (slices.length === 1)
        ? slices[0]
        : Buffer.concat(slices)
      cachedBytes -= bytes
      bytes = yield buf
    }
  }

  if (cachedBytes > 0) {
    // flush
    const firstChunk = chunks.shift().slice(offset) // remaining bytes from first chunk
    const buf = Buffer.concat([firstChunk, ...chunks])
    yield buf
  }
}

function readahead (readable) {
  const reader = readerGenerator(readable)
  reader.next()
  return reader
}

module.exports = readahead
