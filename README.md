# Readahead
A fast way to sequentially and asynchronously access
buffers of any size from a readable.

If your code looks sth. like this:

```js
const { open } = require('fs').promises
const fh = await open('file')
let position = 0
let length = 100
let i = 1e6; while (i--) {
  const { buffer, bytesRead } = await fh.read({ position, length })
  if (bytesRead === 0) break
  position += bytesRead // strictly sequential file access
  console.log(buffer)
  // do sth. with buffer
}
```

`readahead` will speed it up, especially if your average requested buffer size
is less than 4kb

```js
const readahead = require('readahead')
const readable = require('fs').createReadStream('file.data')
const reader = readahead(readable)
let length = 100
let i = 1e6; while (i--) {
  const { value, done } = await reader.next(length)
  if (done) break
  console.log(value) // that's your buffer
}
```


## Benchmark

Execution context: MBP 2015

A 1.6GB pcap file was parsed, segmenting packet header and body. No body decoding.

We compare the reading modes "classic" vs "streaming" vs "idle".

In classic mode, the reader reads the individual buffers as needed, which requires
many read operations on the disk. Slowing down the process.

In streaming mode, the reader reads a configurable amount of bytes ahead using
`fs.createReadStream` and caches them in memory. Once the parser wants to access
these bytes, they are read from memory directly and the rolling window of cached
bytes moves along  until the end of the file is reached.

In idle mode, nothing happens besides the file being read using `fs.createReadStream`.
This serves as limit for "how fast it gets with NodeJS".

|   mode  | duration [s] | compared with idle mode
|---------|--------------|---
|   idle  |    1.164     |  1.0
|  stream |    1.538     |  1.3
| classic |   35.405     | 30.4


### RAW data

```
fh.read every buffer:             29.86s user 17.48s system 133% cpu 35.405 total
readStream and readahead parsing:  1.00s user  0.82s system 118% cpu  1.538 total
readStream, no parsing:            0.45s user  0.99s system 124% cpu  1.164 total (idle reference)
```