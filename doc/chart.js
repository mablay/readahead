const zibar = require('zibar')
const config = require('./zi-config')
const data = [24.9, 20.4, 14.5, 7.3, 3.1, 1.3]
const graph = zibar(data, config)
console.log(graph)
