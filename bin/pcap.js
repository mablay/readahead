const streamParser = require('..')
const fs = require('fs')
const createParser = require('../test/stub/pcap-parser')
const { Transform } = require('stream')

const rs = fs.createReadStream('trace.pcap')
const parser = createParser()
rs
  .pipe(streamParser(parser))
  .on('data', (data) => {
    // console.log(data)
  })
  .on('end', () => {
    console.log('END', parser.fileHeader)
    console.log(process.memoryUsage())
  })
  .on('error', console.error)

// Benchmark
// read only, no parsing: 0.45s user 0.99s system 124% cpu 1.164 total
// read and parse:        1.00s user 0.82s system 118% cpu 1.538 total