# Benchmark

The performance gain seems primarily related to the average
chunk size consumed while parsing the file.

Using `readahead` might provide a noticable performance boost
if the average chunk size is less than 4kb.

## B1 - MD5 local FS
File size: ~1GB
Average sequential read speed: ~6.6 GB/s
Persistence: local NVME
Operation: MD5 hash calculation
```
Speed factor with 6.6 GB/s local FS read - MD5
    
30 │   
27 │         
24 │   ▂▂▂         
21 │   ███         
18 │   ███    ▆▆▆       
15 │   ███    ███       
12 │   ███    ███    ▆▆▆       
 9 │   ███    ███    ███       
 6 │   ███    ███    ███    ▃▃▃      
 3 │   ███    ███    ███    ███      
 0 │   ███    ███    ███    ███    ███    ▃▃▃
   └────┬──────┬──────┬──────┬──────┬──────┬──
        16     64    256   1024   4096   65536
                 average chunk size 
``` 

## B2 - MD5 remote FS
File size: ~1GBMB
Average sequential read speed: ~32 MB/s
Persistence: remote network file system
Operation: MD5 hash calculation
```
Speed Factor with 32 MB/s network read - MD5
    
12 │   ███    
10 │   ███    
 8 │   ███    
 6 │   ███    ▃▃▃
 4 │   ███    ███    
 2 │   ███    ███    ███
 0 │   ███    ███    ███    ███    ▆▆▆    ▃▃▃
   └────┬──────┬──────┬──────┬──────┬──────┬──
        16     64    256   1024   4096   65536
                 average chunk size 
``` 

## B3 - NoOp local FS
File size: ~1GB
Average sequential read speed: ~6.6 GB/s
Persistence: local NVME
Operation: Nothing, just read
```
Speed factor with 6.6 GB/s local FS read - NoOp
    
36 │         
32 │   ███
28 │   ███    ▆▆▆    ███   
24 │   ███    ███    ███
20 │   ███    ███    ███    ▃▃▃
16 │   ███    ███    ███    ███
12 │   ███    ███    ███    ███
 8 │   ███    ███    ███    ███      
 4 │   ███    ███    ███    ███    ███ 
 0 │   ███    ███    ███    ███    ███    ▃▃▃
   └────┬──────┬──────┬──────┬──────┬──────┬──
        16     64    256   1024   4096   65536
                 average chunk size 
``` 

## Numbers 

| av. chunk size | B1 | B2 | B3
|-----:|-----:|-----:|-----:|
|   16 | 24.9 | 12.7 | 33.4 |
|   64 | 20.4 |  4.6 | 28.2 |
|  256 | 14.5 |  2.7 | 29.3 |
| 1024 |  7.3 |  1.4 | 19.2 |
| 4096 |  3.1 |  1.4 |  6.1 |
|65536 |  1.3 |  1.1 |  1.0 |
