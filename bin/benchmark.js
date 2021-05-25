const fs = require('fs')
const sfh = require('../src/readahead')
var { createHash } = require('crypto')
const streamIterator = require('../src/stream-iterator')
const itReader = require('it-reader')

// Fancy:
// $ md5 trace.pcap => 3.279s
// $ node bin/benchmark.js 2.944s

// const src = '/dev/urandom'
const src = 'trace.pcap' // 1674 MB // MD5: 697039cbd38a1b77b9cdf8369a02c840
// const src = '/Users/marc/data/RC-TA-SA2-DHB.csv' // 818 MB
// const src = '/Users/marc/Downloads/Die\ Eiskönigin\ -\ Olaf\ taut\ auf.mp3' // 63 MB
// const src = '/Volumes/Kastor/Video/Movies/MTB/Life.Cycles.2010.720p.BluRay.DD5.1.x264-TsH.mkv'
// const src = '/Volumes/Kastor/Video/Eigene\ Filme/Massmann/R-Team\ mit\ Verena.flv'
// const src = '/Volumes/Kastor/Video/Eigene\ Filme/Massmann/Massmann\ Report\ 2012/Massmann\ Report\ 2012.mov' // 901MB
// const src = '/Users/marc/Movies/videos/Espresso3.m4v' // MD5: dd08a90ed443527c8c3ed28a05143ac1
// last hex: 7a1735a0d21f6ac831c60481eec433eff7087780

// let's read ~1GB
// const chunkSize = 65536 // average read size while parsing a file
const chunkSize = 65536 // average read size while parsing a file
// const chunkCount = 1e5

bench(md5, iterRead, itRead)
// bench(sfhRead)
// bench(sfhRead /*, snailRead, bufferReuse */)

// print funciton names and their execution time in seconds
async function bench (...fns) {
  for (const fn of fns) {
    const start = Date.now()
    const hash = await fn()
    const end = Date.now()
    console.log(fn.name.padStart(12), hash, (end - start) / 1000)
  }
}

async function md5 () {
  return new Promise((resolve, reject) => {
    const hash = createHash('md5')
    fs.createReadStream(src).pipe(hash)
      .on('finish', () => resolve(hash.digest('hex')))
  })
}

async function iterRead () {
  const hash = createHash('md5')
  const rs = fs.createReadStream(src)
  const reader = streamIterator(rs)
  while (true) {
    const { value, done } = await reader.next(chunkSize)
    if (done) break
    hash.update(value)
  }
  // for (let i = 0; i< 10; i++) {
  //   const res = await reader.next(1234)
  //   hash.update(res.value)
  // }
  // for await (const chunk of reader) {
  //   hash.update(chunk)
  // }
  return hash.digest('hex')
}

async function itRead () {
  const hash = createHash('md5')
  const rs = fs.createReadStream(src)
  const reader = itReader(rs)
  while (true) {
    const { value, done } = await reader.next(chunkSize)
      .catch(err => {
        if (err.code !== 'ERR_UNDER_READ') {
          throw err
        }
        return { done: true, value: err.buffer }
      })
      hash.update(value.slice())
      if (done) break
  }
  // for await (const chunk of reader) {
  //   hash.update(chunk.slice())
  // }
  return hash.digest('hex')
}


async function sfhRead () {
  const fh = sfh()
  const hash = createHash('md5')
  fs.createReadStream(src).pipe(fh)
  let i = 0
  let firstBuf
  let lastBuf
  let len = 0
  while (true) {
    const { bytesRead, buffer } = await fh.read(chunkSize)
    len += bytesRead
    if (!firstBuf) firstBuf = buffer
    // if (bytesRead > 0) {
    //   lastBuf = buffer.slice(buffer.byteLength - 20)
    //   hash.update(buffer.slice(0, bytesRead))
    // }
    if (bytesRead < chunkSize) break
  }
  await fh.destroy()
  return hash.digest('hex')
}

async function snailRead () {
  const fh = await fs.promises.open(src)
  const hash = createHash('md5')
  let i = 0
  let firstBuf
  let lastBuf
  let len = 0
  while (true) {
    const buffer = Buffer.alloc(chunkSize)
    const { bytesRead } = await fh.read(buffer, 0, chunkSize, i * chunkSize)
    i++
    len += bytesRead
    if (!firstBuf) firstBuf = buffer
    // if (bytesRead > 0) {
    //   lastBuf = buffer.slice(bytesRead - 20, bytesRead)
    //   hash.update(buffer.slice(0, bytesRead))
    // }
    if (bytesRead < chunkSize) break
  }
  await fh.close()
  return hash.digest('hex')
}

async function bufferReuse () {
  const fh = await fs.promises.open(src)
  const buffer = Buffer.alloc(chunkSize)
  // console.log(Buffer.isBuffer(buffer))
  for (let i=0; i<chunkCount; i++) {
    const { bytesRead } = await fh.read({ buffer })
    buffer.toString()
  }
  await fh.close()
}

