# Readahead - Example usage

## Length prefixed JSON

Creates a stream of lpjson on the fly and parses it.


## PCAP (parse network traces)

Requires some .pcap files

**Benchmark**
Used .pcap file size: 1.6 GB  
Execution context: MBP 2015

pcapWithReadahead => 2.265s  
pcapWithCBindings => 1.910s ~ 20% faster

If you can synchronously consume the data,
pcap.createOfflineSession is great.
But it has no backpressure, that means, if 
you have some async operation you need to complete
before you head over to the next package. You'll
eventually run out of memory.