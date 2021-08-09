import {eDiagonalMovement, iAStar, iAStarProps} from "./aStar.type";
import {iQuadGrid} from "./quadgrid.type";

var Heap = require('./aStarHeap');
var Heuristic = require('./aStarHeuristic');

export class AStarFinder implements iAStar {
    protected _quadGrid: iQuadGrid;
    protected _gArray: Int16Array;
    protected _fArray: Int16Array;
    protected _hArray: Int16Array;
    protected _openedArray: Int8Array;
    protected _closedArray: Int8Array;
    protected _parentArray: Int32Array;
    protected _heuristic: any;
    protected _weight: number;
    protected _diagonalMovement: eDiagonalMovement;

    constructor(opt: iAStarProps) {
        this._quadGrid = opt.quadGrid;
        this._heuristic = Heuristic[opt.heuristic] || Heuristic.manhattan;
        this._weight = opt.weight || 1;
        this._diagonalMovement = opt.diagonalMovement;

        if (!this._diagonalMovement) {
            this._diagonalMovement = eDiagonalMovement.IfAtMostOneObstacle;
        }

        // When diagonal movement is allowed the manhattan heuristic is not
        //admissible. It should be octile instead
        if (this._diagonalMovement === eDiagonalMovement.Never) {
            this._heuristic = Heuristic[opt.heuristic] || Heuristic.manhattan;
        } else {
            this._heuristic = Heuristic[opt.heuristic] || Heuristic.octile;
        }
    }


    _nodeOfPoint(x: number, y: number): number {
        return this._quadGrid.nodeOfPoint(0, x, y);
    }

    _nodeNeighbours(nodeIndex: number): number[] {
        return this._quadGrid.neighbours(nodeIndex);
    }

    _nodeX(nodeIndex: number): number {
        return this._quadGrid.nodeX[nodeIndex];
    }

    _nodeY(nodeIndex: number): number {
        return this._quadGrid.nodeY[nodeIndex];
    }

    _initGrid(quadGrid: iQuadGrid) {
        if (this._parentArray?.length === quadGrid.nodeAnchor) return;
        this._gArray = new Int16Array(quadGrid.nodeAnchor);
        this._fArray = new Int16Array(quadGrid.nodeAnchor);
        this._hArray = new Int16Array(quadGrid.nodeAnchor);
        this._openedArray = new Int8Array(quadGrid.nodeAnchor);
        this._closedArray = new Int8Array(quadGrid.nodeAnchor);
        this._parentArray = new Int32Array(quadGrid.nodeAnchor);

    }

    _resetStatus() {
        this._gArray.fill(0);
        this._fArray.fill(0);
        this._hArray.fill(0);
        this._openedArray.fill(0);
        this._closedArray.fill(0);
        this._parentArray.fill(0);
    }

    _backtrace(nodeIndex: number) {
        const path = [nodeIndex];
        while(this._parentArray[nodeIndex]) {
            nodeIndex = this._parentArray[nodeIndex];
            path.push(nodeIndex);
        }
        return path.reverse();
    }

    findPath(sx, sy, ex, ey, grid): number[] {
        console.log(this._parentArray?.length, grid.nodeAnchor)
        this._initGrid(grid);
        this._resetStatus();
        let openList = new Heap((nodeA, nodeB) => {
                return this._fArray[nodeA] - this._fArray[nodeB];
            }),
            startNode = this._nodeOfPoint(sx, sy),
            endNode = this._nodeOfPoint(ex, ey),
            heuristic = this._heuristic,
            diagonalMovement = this._diagonalMovement,
            weight = this._weight,
            abs = Math.abs, SQRT2 = Math.SQRT2,
            node: number, neighbors: number[], neighbor: number, i, l, x, y, ng;

        // set the `g` and `f` value of the start node to be 0
        this._gArray[startNode] = 0;
        this._fArray[startNode] = 0;

        // push the start node into the open list
        openList.push(startNode);
        this._openedArray[startNode] = 1;

        // while the open list is not empty
        while (!openList.empty()) {
            // pop the position of node which has the minimum `f` value.
            node = openList.pop();
            this._closedArray[node] = 1;

            // if reached the end position, construct the path and return it
            if (node === endNode) {
                return this._backtrace(endNode);
            }

            // get neigbours of the current node
            // neighbors = this.nodeNeighbours(node, diagonalMovement);    // todo
            neighbors = this._nodeNeighbours(node);
            for (i = 0, l = neighbors.length; i < l; ++i) {
                neighbor = neighbors[i];

                if (this._closedArray[neighbor]) {
                    continue;
                }

                x = this._nodeX(neighbor);
                y = this._nodeY(neighbor);

                // get the distance between current node and the neighbor
                // and calculate the next g score
                ng = this._gArray[node] + ((x - this._nodeX(node) === 0 || y - this._nodeY(node) === 0) ? 1 : SQRT2);

                // check if the neighbor has not been inspected yet, or
                // can be reached with smaller cost from the current node
                if (!this._openedArray[neighbor] || ng < this._gArray[neighbor]) {
                    this._gArray[neighbor] = ng;
                    this._hArray[neighbor] = this._hArray[neighbor] || weight * heuristic(abs(x - ex), abs(y - ey));
                    this._fArray[neighbor] = this._gArray[neighbor] + this._hArray[neighbor];
                    this._parentArray[neighbor] = node;

                    if (!this._openedArray[neighbor]) {
                        openList.push(neighbor);
                        this._openedArray[neighbor] = 1;
                    } else {
                        // the neighbor can be reached with smaller cost.
                        // Since its f value has been updated, we have to
                        // update its position in the open list
                        openList.updateItem(neighbor);
                    }
                }
            } // end for each neighbor
        } // end while not open list empty

        // fail to find the path
        return [];
    };
}
