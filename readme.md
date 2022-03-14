# introduction
### This package includes 
quadgrid api - for rectangle insertion, query rect coverage, point coverage in quad tree structure buffer array
quadpath api - for finding path using several different finder methods in quadgrid object

### The rectangle data
The rectangle data object used in this project is represented by [middleX, middleY, halfWidth, halfHeight]

### Todos
* The width,height settings in quad tree increased complexity of the api algorithm, I am planning to replace rectangle to square shape as tree node. so there wont be width, height when making rectangle object,  that's why there is only 'ws' in quadgrid object, it actually forced the quadgrid and its nodes to be square only. Sorry about this confusion part. 

# How to run

1. npm i
2. npm run pack
3. npm run server
