# introduction
### This package includes 
quadgrid api - for rectangle insertion, query rect coverage, point coverage in quad tree structure arrayBuffer
quadpath api - for finding path using several different finder methods in quadgrid object

### The rectangle object
The rectangle object used in this project is represented by [middleX, middleY, halfWidth, halfHeight]

### The arrayBuffer
For performance reason, quadgrid data stored in several arrayBuffer, the '_cellBatchSize' can be modified if you want to increase it or save memory space. Depends on the grid size you are going to make, the max nodeSize/_cellBatchSize can be vary case to case, but it is not hard to find out, just set a size for the quadgrid and minimal size of node cell, then add as many nodes your use case need, check the node amount, then set a bigger value as _cellBatchSize so it cover the max node amount range.

### Todos
* The width,height settings in quad tree increased complexity of the api algorithm, I am planning to replace rectangle to square shape as tree node. so there wont be width, height when making rectangle object,  that's why there is only 'ws' in quadgrid object, it actually forced the quadgrid and its nodes to be square only. Sorry about this confusion part. 

# How to run

1. npm i
2. npm run pack
3. npm run server
