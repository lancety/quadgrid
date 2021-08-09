import {bNode, iBound, iQuadGrid} from "./quadgrid.type";

export class QuadGrid implements iQuadGrid {
    _cellDepthMax: number;
    _cellBatchSize = 100000;

    xs: Float32Array;   // x array
    ys: Float32Array;   // y array
    ws: Float32Array;   // w array
    hs: Float32Array;   // h array
    ps: bNode;      // parent array
    ms: bNode;      // map refs of 4 children array

    ls: Int8Array;  // level array
    cs: Int8Array;  // covered array
    ts: Int8Array;  // taken array

    a = 0;

    constructor(public width, public height, public cellMinSize) {
        this.xs = new Float32Array(this._cellBatchSize);
        this.ys = new Float32Array(this._cellBatchSize);
        this.ws = new Float32Array(this._cellBatchSize);
        this.hs = new Float32Array(this._cellBatchSize);
        this.ls = new Int8Array(this._cellBatchSize);
        this.cs = new Int8Array(this._cellBatchSize);
        this.ts = new Int8Array(this._cellBatchSize);
        this.ps = new Int32Array(this._cellBatchSize);
        this.ms = new Int32Array(this._cellBatchSize * 4);

        this._depth();
        this._rootNode();
    }

    private _depth() {
        this._cellDepthMax = 0;
        let boundSize = Math.min(this.width, this.height);
        while (boundSize > this.cellMinSize) {
            boundSize /= 2;
            this._cellDepthMax++;
        }

    }

    private _rootNode() {
        this._newNode(0, this.width / 2, this.height / 2, this.width / 2, this.height / 2, 0);
    }

    private _newNode(parentIndex, mx: number, my: number, hw: number, hh: number, level: number) {
        const a = this.a;
        this.ps[a] = parentIndex;
        this.xs[a] = mx;
        this.ys[a] = my;
        this.ws[a] = hw;
        this.hs[a] = hh;
        this.ls[a] = level;
        const nodeIndex = a;
        this.a++;
        return nodeIndex;
    }


    private _merge(boundOffset: number) {
        this.ms.fill(0, boundOffset, boundOffset + 4);
    }

    private _split(nodeIndex: number, indexOffset: number) {
        const nextLevel = this.ls[nodeIndex] + 1,
            x = this.xs[nodeIndex],
            y = this.ys[nodeIndex],
            subWidth = this.ws[nodeIndex] / 2,
            subHeight = this.hs[nodeIndex] / 2;

        this.ms[indexOffset] =
            this._newNode(nodeIndex, x - subWidth, y - subHeight, subWidth, subHeight, nextLevel); //lt
        this.ms[indexOffset + 1] =
            this._newNode(nodeIndex, x + subWidth, y - subHeight, subWidth, subHeight, nextLevel); //rt
        this.ms[indexOffset + 2] =
            this._newNode(nodeIndex, x + subWidth, y + subHeight, subWidth, subHeight, nextLevel); //rb
        this.ms[indexOffset + 3] =
            this._newNode(nodeIndex, x - subWidth, y + subHeight, subWidth, subHeight, nextLevel); //lb

    }

    /**
     *
     * @param centerX   reference of center
     * @param centerY   reference of center
     * @param x     center of checked rect OR x of checked point
     * @param y     center of checked rect OR y of checked point
     * @param {number} w    rect half width OR 0 for point
     * @param {number} h    rect half height OR 0 for point
     * @returns {number}    lt=0, rt=1, rb=2, lb=3
     */
    private _indexToCenter(centerX, centerY, x, y, w = 0, h = 0) {
        const startIsNorth = y - h <= centerY,
            startIsWest = x - w <= centerX,
            endIsEast = x + w > centerX,
            endIsSouth = y + h > centerY;
        let indexes = 0b0;

        //lt
        if (startIsWest && startIsNorth) {
            indexes = indexes | 0b1;
        }

        //rt
        if (startIsNorth && endIsEast) {
            indexes = indexes | 0b10;
        }

        //rb
        if (endIsEast && endIsSouth) {
            indexes = indexes | 0b100;
        }

        //lb
        if (startIsWest && endIsSouth) {
            indexes = indexes | 0b1000;
        }

        return indexes;
    }

    private _indexCoveredOnNode(nodeIndex: number, rx: number, ry: number, rw: number, rh: number) {
        return this._indexToCenter(this.xs[nodeIndex], this.ys[nodeIndex], rx, ry, rw, rh);
    }

    private _indexPointedOnNode(nodeIndex: number, x: number, y: number) {
        return this._indexToCenter(this.xs[nodeIndex], this.ys[nodeIndex], x, y);

    }

    /**
     *
     * @param {number} nodeIndex
     * @param rx
     * @param ry
     * @param rw
     * @param rh
     * @returns {boolean}
     */
    private _covered(nodeIndex: number, rx: number, ry: number, rw: number, rh: number) {
        return this._coveredCheck(
            this.xs[nodeIndex], this.ys[nodeIndex], this.ws[nodeIndex], this.hs[nodeIndex],
            rx, ry, rw, rh
        )
    }

    private _coveredCheck(sx, sy, sw, sh, lgx, lgy, lgw, lgh) {
        const diffX = sx - lgx;
        const diffY = sy - lgy;
        const diffW = sw - lgw;
        const diffH = sh - lgh;
        return diffW <= 0 && diffH <= 0 && diffX - diffW >= 0 && diffY - diffH >= 0 && diffX + diffW <= 0 && diffY + diffH <= 0;
    }

    in(nodeIndex: number, rx, ry, rw, rh) {
        const indexOffset = nodeIndex * 4;
        const newCoverTest = this._covered(nodeIndex, rx, ry, rw, rh);
        if (newCoverTest === true) {
            if (this.cs[nodeIndex] !== 1) {
                this._merge(indexOffset);
                this.ts[nodeIndex] = 1;
                this.cs[nodeIndex] = 1;
            }
        } else {
            if (this.ls[nodeIndex] < this._cellDepthMax && !this.cs[nodeIndex] && !this.ms[indexOffset]) {
                this._split(nodeIndex, indexOffset);
            }

            if (this.ms[indexOffset]) {
                const binaryIndexes = this._indexCoveredOnNode(nodeIndex, rx, ry, rw, rh);
                binaryIndexes & 0b1 && this.in(this.ms[indexOffset], rx, ry, rw, rh);
                binaryIndexes & 0b10 && this.in(this.ms[indexOffset + 1], rx, ry, rw, rh);
                binaryIndexes & 0b100 && this.in(this.ms[indexOffset + 2], rx, ry, rw, rh);
                binaryIndexes & 0b1000 && this.in(this.ms[indexOffset + 3], rx, ry, rw, rh);
            }

            if (this.ms[indexOffset] === 0) {
                this.ts[nodeIndex] = 1;
            } else {
                this.ts[nodeIndex] = 0;
            }
        }
    }

    ins(rects: iBound[]) {
        const start = typeof performance === "undefined" ? Date.now() : performance.now();
        rects.forEach(rect => {
            this.in(0, rect[0], rect[1], rect[2], rect[3]);
        })
        const startUi = typeof performance === "undefined" ? Date.now() : performance.now();
        return startUi - start;
    }

    private _neighbourTopParentIndex(nodeIndex: number, rx: number, ry: number, rw: number, rh: number): number {
        const parentIndex = this.ps[nodeIndex];
        if (parentIndex === 0)
            return parentIndex;

        const inside = this._coveredCheck(
            rx, ry, rw, rh,
            this.xs[parentIndex], this.ys[parentIndex], this.ws[parentIndex], this.hs[parentIndex]);
        if (inside) {
            return parentIndex;
        } else {
            return this._neighbourTopParentIndex(parentIndex, rx, ry, rw, rh);
        }
    }

    /**
     *
     * @param {number[]} neighboursIndex
     * @param nodeIndex
     * @param rx
     * @param ry
     * @param rw
     * @param rh
     * @param minNeighbourRadius  min half size (radius) will be considered as a neighbour
     * @returns {number[]}
     */
    private _neighbourQuery(neighboursIndex: number[], nodeIndex, rx, ry, rw, rh, minNeighbourRadius = 0): number[] {
        if (minNeighbourRadius && (this.ws[nodeIndex] < minNeighbourRadius || this.hs[nodeIndex] < minNeighbourRadius)) {
            return;
        }

        const indexOffset = nodeIndex * 4;
        const indexOfRect = this._indexCoveredOnNode(nodeIndex, rx, ry, rw, rh);
        if (indexOfRect > 0) {
            if (this.ms[indexOffset] === 0) {
                if (this.ts[nodeIndex] === 0) {
                    neighboursIndex.push(nodeIndex)
                }
            } else {
                indexOfRect & 0b1 && this._neighbourQuery(neighboursIndex, this.ms[indexOffset], rx, ry, rw, rh, minNeighbourRadius);
                indexOfRect & 0b10 && this._neighbourQuery(neighboursIndex, this.ms[indexOffset + 1], rx, ry, rw, rh, minNeighbourRadius);
                indexOfRect & 0b100 && this._neighbourQuery(neighboursIndex, this.ms[indexOffset + 2], rx, ry, rw, rh, minNeighbourRadius);
                indexOfRect & 0b1000 && this._neighbourQuery(neighboursIndex, this.ms[indexOffset + 3], rx, ry, rw, rh, minNeighbourRadius);
            }
        }

        return neighboursIndex;
    }


    nbs(nodeIndex: number, minNeighbourRadius = 0): number[] {
        const extraBound = this.cellMinSize / 2;
        const rx = this.xs[nodeIndex],
            ry = this.ys[nodeIndex];
        const rw = this.ws[nodeIndex] + extraBound;
        const rh = this.hs[nodeIndex] + extraBound;
        const topParent = this._neighbourTopParentIndex(nodeIndex, rx, ry, rw, rh);
        return this._neighbourQuery([], topParent, rx, ry, rw, rh, minNeighbourRadius);
    }

    private _neighbourCollideQuery(neighboursIndex: number[], nodeIndex, rx, ry, rw, rh): number[] {
        const indexOffset = nodeIndex * 4;
        const indexOfRect = this._indexCoveredOnNode(nodeIndex, rx, ry, rw, rh);
        if (indexOfRect > 0) {
            if (this.ms[indexOffset] === 0) {
                if (this.ts[nodeIndex] === 0) {
                    neighboursIndex.push(nodeIndex)
                } else {
                    neighboursIndex[-1] = 1;
                }
            } else {
                indexOfRect & 0b1 && this._neighbourCollideQuery(neighboursIndex, this.ms[indexOffset], rx, ry, rw, rh);
                indexOfRect & 0b10 && this._neighbourCollideQuery(neighboursIndex, this.ms[indexOffset + 1], rx, ry, rw, rh);
                indexOfRect & 0b100 && this._neighbourCollideQuery(neighboursIndex, this.ms[indexOffset + 2], rx, ry, rw, rh);
                indexOfRect & 0b1000 && this._neighbourCollideQuery(neighboursIndex, this.ms[indexOffset + 3], rx, ry, rw, rh);
            }
        }

        return neighboursIndex;
    }

    nbc(nodeIndex: number, collideRadius = 0): boolean {
        if (this.ws[nodeIndex] >= collideRadius && this.hs[nodeIndex] >= collideRadius) {
            return false;
        }

        const rx = this.xs[nodeIndex],
            ry = this.ys[nodeIndex],
            rw = collideRadius,
            rh = collideRadius;
        const topParent = this._neighbourTopParentIndex(nodeIndex, rx, ry, rw, rh);
        const neighboursCollideCheck = this._neighbourCollideQuery([], topParent, rx, ry, rw, rh);
        return neighboursCollideCheck[-1] === 1;
    }

    np(nodeIndex: number, x: number, y: number): number {
        const indexOffset = nodeIndex * 4;
        if (this.ms[indexOffset] === 0) {
            return nodeIndex;
        } else {
            const indexOfPoint = this._indexPointedOnNode(nodeIndex, x, y);
            if (this.ms[indexOffset] > 0 && indexOfPoint > 0) {
                if (indexOfPoint & 0b1) return this.np(this.ms[indexOffset], x, y);
                else if (indexOfPoint & 0b10) return this.np(this.ms[indexOffset + 1], x, y);
                else if (indexOfPoint & 0b100) return this.np(this.ms[indexOffset + 2], x, y);
                else if (indexOfPoint & 0b1000) return this.np(this.ms[indexOffset + 3], x, y);
            } else {
                return nodeIndex;
            }
        }
    }


    del() {
        delete this.xs;
        delete this.ys;
        delete this.ws;
        delete this.hs;
        delete this.ls;
        delete this.cs;
        delete this.ts;
        delete this.ms;
    }

    reset() {
        this.xs.fill(0);
        this.ys.fill(0);
        this.ws.fill(0);
        this.hs.fill(0);
        this.cs.fill(0);
        this.ls.fill(0);
        this.ts.fill(0);
        this.ms.fill(0);

        this.a = 0;
        this._rootNode();
    }
}
