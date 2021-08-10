import {iAStar, iAStarProps} from "./aStar.type";
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

    constructor(opt: iAStarProps) {
        this._quadGrid = opt.quadGrid;
        this._heuristic = Heuristic[opt.heuristic] || Heuristic.manhattan;
        this._weight = opt.weight || 1;
    }


    _nodeOfPoint(x: number, y: number): number {
        return this._quadGrid.np(0, x, y);
    }

    _nodeX(nodeIndex: number): number {
        return this._quadGrid.xs[nodeIndex];
    }

    _nodeY(nodeIndex: number): number {
        return this._quadGrid.ys[nodeIndex];
    }

    _initGrid(quadGrid: iQuadGrid) {
        if (this._parentArray?.length === quadGrid.a) return;
        this._gArray = new Int16Array(quadGrid.a);
        this._fArray = new Int16Array(quadGrid.a);
        this._hArray = new Int16Array(quadGrid.a);
        this._openedArray = new Int8Array(quadGrid.a);
        this._closedArray = new Int8Array(quadGrid.a);
        this._parentArray = new Int32Array(quadGrid.a);

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
        while (this._parentArray[nodeIndex]) {
            nodeIndex = this._parentArray[nodeIndex];
            path.push(nodeIndex);
        }
        return path.reverse();
    }

    ps(sx, sy, ex, ey, grid, collideRadius?: number): number[] {
        const startNode = this._nodeOfPoint(sx, sy),
            endNode = this._nodeOfPoint(ex, ey);
        const minNeighbourRadius = collideRadius ? collideRadius / 2 : 0;
        if (collideRadius && this._quadGrid.nbc(endNode, collideRadius)) {
            return [];
        }

        this._initGrid(grid);
        this._resetStatus();
        let openList = new Heap((nodeA, nodeB) => {
            return this._fArray[nodeA] - this._fArray[nodeB];
        });

        if (this._quadGrid.ts[startNode] || this._quadGrid.ts[endNode]) {
            return [];
        }

        let heuristic = this._heuristic,
            weight = this._weight,
            abs = Math.abs, SQRT2 = Math.SQRT2,
            node: number, neighbors: number[], neighbour: number, i, l, x, y, w, h, nx, ny, nw, nh, ng;

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
            x = this._nodeX(node);
            y = this._nodeY(node);
            w = this._quadGrid.ws[node];
            h = this._quadGrid.hs[node];

            this._closedArray[node] = 1;

            // if reached the end position, construct the path and return it
            if (node === endNode) {
                return this._backtrace(endNode);
            }

            // get neigbours of the current node
            neighbors = this._quadGrid.nbs(node, minNeighbourRadius);
            for (i = 0, l = neighbors.length; i < l; ++i) {
                neighbour = neighbors[i];
                nx = this._nodeX(neighbour);
                ny = this._nodeY(neighbour);
                nw = this._quadGrid.ws[neighbour];
                nh = this._quadGrid.hs[neighbour];

                if (this._closedArray[neighbour]) {
                    continue;
                }

                if (collideRadius && this._quadGrid.nbc(neighbour, collideRadius)) {
                    if (neighbour === endNode) {
                        const path = this._backtrace(node);
                        path.push(endNode);
                        return path;
                    } else {
                        continue;
                    }
                }

                // if same level nodes pass through shared corner, check
                // - same or smaller neighbour at corner -> if all cross neighbour is
                let checkCross = false;
                if (this._quadGrid.ls[node] !== this._quadGrid.ls[neighbour]) {
                    const sx = x - w, ex = x + w,
                        sy = y - h, ey = y - h;
                    checkCross = (nx < sx - 1 || nx > ex + 1) && (ny < sy - 1 || ny > ey + 1);
                }
                else {
                    checkCross = x !== nx && y !== ny;  // neighbour is corner of this node
                }
                if (checkCross) {
                    const jointX = nx > x ? x + w : x - w;
                    const jointY = ny > y ? y + h : y - h;
                    const crossNodes = this._quadGrid.nbq([], 0,
                        jointX,
                        jointY,
                        2,
                        2
                    )

                    const blocked = crossNodes.find(neighbour => {
                        return this._quadGrid.ws[neighbour] < collideRadius || this._quadGrid.hs[neighbour] < collideRadius;
                    })
                    if (blocked) continue;
                }

                // get the distance between current node and the neighbor
                // and calculate the next g score
                ng = this._gArray[node] + Math.sqrt((x - nx) * (x - nx) + (y - ny) * (y - ny));
                // ng = this._gArray[node] + ((x - this._nodeX(node) === 0 || y - this._nodeY(node) === 0) ? 1 : SQRT2);
                // check if the neighbor has not been inspected yet, or
                // can be reached with smaller cost from the current node
                if (!this._openedArray[neighbour] || ng < this._gArray[neighbour]) {
                    this._gArray[neighbour] = ng;
                    this._hArray[neighbour] = this._hArray[neighbour] || weight * Math.sqrt((ex - nx) * (ex - nx) + (ey - ny) * (ey - ny));
                    this._fArray[neighbour] = this._gArray[neighbour] + this._hArray[neighbour];
                    this._parentArray[neighbour] = node;

                    if (this._openedArray[neighbour]) {
                        // the neighbor can be reached with smaller cost.
                        // Since its f value has been updated, we have to
                        // update its position in the open list
                        openList.updateItem(neighbour);
                    } else {
                        openList.push(neighbour);
                        this._openedArray[neighbour] = 1;
                    }
                }
            } // end for each neighbor
        } // end while not open list empty

        // fail to find the path
        return [];
    };
}
