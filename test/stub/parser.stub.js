function stubParser (len = 100) {
  let i = 0
  return {
    expect: () => len,
    parse: buf => ({
      n: i++,
      len: buf.byteLength.toString(16)
    })
  }
}

module.exports = stubParser
