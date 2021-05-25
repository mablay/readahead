module.exports = {
  max: 30,
  min: 0,
  high: 25,
  // marks: [ 0, "?", 0, 0, { symbol: "▼", color: "red,bold" } ],
  color: "green",
  colors: {
    // 5: "magenta,bold"
  },
  // vlines: [null, null, "cyan"],
  yAxis: {
    decimals: 0
  },
  xAxis: {
    display: true,           // show/hide the axis labels
    color: "yellow,bold",    // axis label color
    interval: 2,             // distance between labels
    origin: 0,              // axis scale starts with this value
    factor: 20,               // axis scale multiplier
    offset: 0       
  }
}