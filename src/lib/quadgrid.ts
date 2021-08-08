import {iBound, iQuadGrid} from "./quadgrid.type";

export class QuadGrid implements iQuadGrid {
    cellMinSize: number;
    cellBatchSize = 100000;

    nodeBounds: Float32Array;
    nodesRef: Int32Array;

    nodesLevel: Int8Array;
    nodesCovered: Int8Array;
    nodesTaken: Int8Array;

    nodeAnchor = 0;

    constructor(public width, public height,
                public cellDepthMax = 6) {
        this.cellMinSize = Math.min(width, height) / Math.pow(2, cellDepthMax);

        this.nodeBounds = new Float32Array(this.cellBatchSize * 4);
        this.nodesRef = new Int32Array(this.cellBatchSize * 4);
        this.nodesLevel = new Int8Array(this.cellBatchSize);
        this.nodesCovered = new Int8Array(this.cellBatchSize);
        this.nodesTaken = new Int8Array(this.cellBatchSize);

        this.newNode(width / 2, height / 2, width / 2, height / 2, 0);
    }

    newNode(mx: number, my: number, hw: number, hh: number, level: number) {
        const offset = this.nodeAnchor * 4;
        this.nodeBounds[offset] = mx;
        this.nodeBounds[offset+1] = my;
        this.nodeBounds[offset+2] = hw;
        this.nodeBounds[offset+3] = hh;
        this.nodesLevel[this.nodeAnchor] = level;
        const nodeIndex = this.nodeAnchor;
        this.nodeAnchor++;
        return nodeIndex;
    }


    split(nodeIndex: number) {
        const boundOffset = nodeIndex * 4;
        const nextLevel = this.nodesLevel[nodeIndex] + 1,
            x = this.nodeBounds[boundOffset],
            y = this.nodeBounds[boundOffset + 1],
            subWidth = this.nodeBounds[boundOffset + 2] / 2,
            subHeight = this.nodeBounds[boundOffset + 3] / 2;

        this.nodesRef.set([
            this.newNode(x - subWidth, y - subHeight, subWidth, subHeight, nextLevel), //lt
            this.newNode(x + subWidth, y - subHeight, subWidth, subHeight, nextLevel), //rt
            this.newNode(x + subWidth, y + subHeight, subWidth, subHeight, nextLevel), //rb
            this.newNode(x - subWidth, y + subHeight, subWidth, subHeight, nextLevel), //lb
        ], boundOffset);
    }

    getIndex(boundOffset: number, rect: iBound) {
        let indexes = 0b0,
            verticalMidpoint = this.nodeBounds[boundOffset],
            horizontalMidpoint = this.nodeBounds[boundOffset + 1];

        const startIsNorth = rect[1] - rect[3] < horizontalMidpoint,
            startIsWest = rect[0] - rect[2] < verticalMidpoint,
            endIsEast = rect[0] + rect[2] > verticalMidpoint,
            endIsSouth = rect[1] + rect[3] > horizontalMidpoint;

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

    merge(boundOffset: number) {
        this.nodesRef.set([0, 0, 0, 0], boundOffset);
    }

    /**
     *
     * @param {number} offset   nodeBounds index offset
     * @param {iBound} rect
     * @returns {boolean}
     */
    inside(offset: number, rect: iBound) {
        const diffX = this.nodeBounds[offset] - rect[0];
        const diffY = this.nodeBounds[offset + 1] - rect[1];
        const diffW = this.nodeBounds[offset + 2] - rect[2];
        const diffH = this.nodeBounds[offset + 3] - rect[3];
        return diffW <= 0 && diffH <= 0 && diffX - diffW >= 0 && diffY - diffH >= 0 && diffX + diffW <= 0 && diffY + diffH <= 0;
    }

    insertBatch(boundOffset: number, rect: iBound, method: string) {
        const binaryIndexes = this.getIndex(boundOffset, rect);
        binaryIndexes & 0b1 && this[method](this.nodesRef[boundOffset], rect);
        binaryIndexes & 0b10 && this[method](this.nodesRef[boundOffset + 1], rect);
        binaryIndexes & 0b100 && this[method](this.nodesRef[boundOffset + 2], rect);
        binaryIndexes & 0b1000 && this[method](this.nodesRef[boundOffset + 3], rect);
    }

    insert(nodeIndex: number, rect: iBound) {
        const boundOffset = nodeIndex * 4;
        const newCoverTest = this.inside(boundOffset, rect);
        if (newCoverTest === true) {
            if (this.nodesCovered[nodeIndex] !== 1) {
                this.merge(boundOffset);
                this.nodesTaken[nodeIndex] = 1;
                this.nodesCovered[nodeIndex] = 1;
            }
        } else {
            if (this.nodesLevel[nodeIndex] < this.cellDepthMax && !this.nodesCovered[nodeIndex] && !this.nodesRef[boundOffset]) {
                this.split(nodeIndex);
            }

            if (this.nodesRef[boundOffset]) {
                this.insertBatch(boundOffset, rect, "insert");
            }

            if (this.nodesRef[boundOffset] === 0) {
                this.nodesTaken[nodeIndex] = 1;
            } else {
                this.nodesTaken[nodeIndex] = 0;
            }
        }
    }

}
