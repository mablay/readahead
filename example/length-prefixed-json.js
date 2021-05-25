// Synopsis: 
// $ node example/lp-json/lp-example.js [count=10] [chunkSize=65536]

const { lpjSerialiser, lpjParser } = require('../test/stub/lpjson-encoding')
const readahead = require('..')

async function main(count, chunkSize) {
  // mock `count` length prefixed json messages
  // distributed over buffers with fixed length `chunkSize`.
  // source is what you'd usuallly get from fs.createReadStream(file)
  const source = lpjSerialiser(count, chunkSize)

  // means to sequentially access the next bytes of source
  // controlling how many bytes are read
  const reader = readahead(source)

  // This is the actual example code you should look at.
  // It decodes sequence of length prefixes and json messages.
  const parser = lpjParser(reader)

  // read, tokenize, parse, log
  for await (const obj of parser) {
    console.log(obj)
  }
}

// parse cli args
const [
  count = 10,
  chunkSize = 65536
] = process.argv.slice(2).map(x => parseInt(x))

// Run the program. Hoisted functions below.
main(count, chunkSize)