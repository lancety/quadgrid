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
        return this._quadGrid.npt(0, x, y);
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

    ps(sx, sy, ex, ey, grid: iQuadGrid, collideRadius: number): number[] {
        const startNode = this._nodeOfPoint(sx, sy);
        let endNode = this._nodeOfPoint(ex, ey);
        const minNeighbourRadius = collideRadius ? collideRadius / 2 : 0;

        // if target node is very small, then look for larger neighbour (x2 at least >= minNeighbourRadius)
        if (minNeighbourRadius && (grid.ws[endNode] < minNeighbourRadius || grid.hs[endNode] < minNeighbourRadius)) {
            const nbs = grid.nbs(endNode, minNeighbourRadius);
            if (!nbs) return [];
            endNode = nbs.find(n => grid.ws[n] >= minNeighbourRadius && grid.hs[n] >= minNeighbourRadius);
            if (!endNode) return [];
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
            node: number, neighbors: number[], neighbour: number,
            i, l, x, y, w, h, level,
            nx, ny, nw, nh, ng, nlevel,
            bx, by, // the body expected coord x and y
            isCross, isValidNext, refNode, refSmall, refLarge;

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
            level = this._quadGrid.ls[node];

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
                nlevel = this._quadGrid.ls[neighbour];

                if (this._closedArray[neighbour]) {
                    continue;
                }
                if (neighbour !== endNode) {
                    if (nw < minNeighbourRadius || nh < minNeighbourRadius) {
                        continue
                    }
                }

                // level is opposite value, smaller value means upper level - bigger
                isCross = false;
                if (level < nlevel) {
                    // small neighbour cell is outside of big node cell
                    const sx = x - w, ex = x + w,
                        sy = y - h, ey = y + h;
                    isCross = (nx < sx - 1 || nx > ex + 1) && (ny < sy - 1 || ny > ey + 1);
                } else if (level > nlevel) {
                    // small node cell is outside of big neighbour cell
                    const sx = nx - nw, ex = nx + nw,
                        sy = ny - nh, ey = ny + nh;
                    isCross = (x < sx - 1 || x > ex + 1) && (y < sy - 1 || y > ey + 1);
                } else {
                    // same size node and neighbour cells are not aligned same x and y direction
                    isCross = x !== nx && y !== ny;  // neighbour is corner of this node
                }


                if (isCross) {
                    const jointX = nx > x ? x + w : x - w;
                    const jointY = ny > y ? y + h : y - h;
                    // const checkSize = minNeighbourRadius;
                    const checkSize = collideRadius * Math.SQRT2;
                    // // todo - opt1
                    // const crossNodes = this._quadGrid.nbq([], 0,
                    //     jointX,
                    //     jointY,
                    //     checkSize,
                    //     checkSize,
                    // )
                    //
                    // // blocked - if cross cells are smaller than checkSize (gap between 2 cell on left and right)
                    // const blocked = crossNodes.find(neighbour => {
                    //     return this._quadGrid.ws[neighbour] < checkSize || this._quadGrid.hs[neighbour] < checkSize;
                    // })
                    // if (blocked) continue;

                    // todo - opt2
                    if (this._quadGrid.rc(
                        jointX,
                        jointY,
                        checkSize,
                        checkSize,
                    )) continue;
                } else {
                    if (neighbour === endNode) {
                        const path = this._backtrace(node);
                        path.push(endNode);
                        return path;
                    }

                    isValidNext = true;

                    if (nw < collideRadius || nh < collideRadius) {
                        if (nw < minNeighbourRadius || nh < minNeighbourRadius) {
                            isValidNext = false;    // this already checked on top
                        } else if (level <= nlevel) {   // node larger than neighbour
                            refNode = 0;
                            // the direction have twin cells
                            if (nx < x - w || nx > x + w) {         // < >
                                refSmall = ny - nh - 1;
                                refLarge = ny + nh + 1;
                                if (refSmall > y - h) {  // top cell is inside y range of node
                                    refNode = this._quadGrid.npt(0, nx, refSmall);
                                } else if (refLarge < y + h) {   // bottom cell is inside y range of node
                                    refNode = this._quadGrid.npt(0, nx, refLarge);
                                }
                            } else if (ny < y - h || ny > y + h) {  // ^ v
                                refSmall = nx - nw - 1;
                                refLarge = nx + nw + 1;
                                if (refSmall > x - w) {  // left cell is inside x range of node
                                    refNode = this._quadGrid.npt(0, refSmall, ny);
                                } else if (refLarge < x + w) {   // right cell is inside x range of node
                                    refNode = this._quadGrid.npt(0, refLarge, ny);
                                }
                            }

                            if (!refNode || this._quadGrid.ls[refNode] !== nlevel) {
                                isValidNext = false;
                            }
                        } else if (level > nlevel) {    // node smaller than neighbour
                            const parent = this._quadGrid.ps[node];
                            if (x < nx - w) {           // from < to >

                            } else if (x > nx + w) {    // from > to <

                            } else if (y < ny - h) {    // from ^ to v

                            } else if (y > ny + h) {    // from v to ^

                            }
                        } else {
                            isValidNext = false
                        }
                    }
                    if (isValidNext === false) continue;
                }

                // get the distance between current node and the neighbor
                // and calculate the next g score
                ng = this._gArray[node] + heuristic(nx < x ? x - nx : nx - x, ny < y ? y - ny : ny - y);
                // ng = this._gArray[node] + Math.sqrt((x - nx) * (x - nx) + (y - ny) * (y - ny));

                // check if the neighbor has not been inspected yet, or
                // can be reached with smaller cost from the current node
                if (!this._openedArray[neighbour] || ng < this._gArray[neighbour]) {
                    this._gArray[neighbour] = ng;
                    this._hArray[neighbour] = this._hArray[neighbour] || weight * heuristic(nx < ex ? ex - nx : nx - ex, ny < ey ? ey - ny : ny - ey);
                    // this._hArray[neighbour] = this._hArray[neighbour] || weight * Math.sqrt((ex - nx) * (ex - nx) + (ey - ny) * (ey - ny));
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
