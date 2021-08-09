import {bNode, iBound, iQuadGrid} from "./quadgrid.type";

export class QuadGrid implements iQuadGrid {
    cellDepthMax: number;
    cellBatchSize = 100000;

    nodeX: Float32Array;
    nodeY: Float32Array;
    nodeW: Float32Array;
    nodeH: Float32Array;
    nodesParent: bNode;
    nodesRef: bNode;

    nodesLevel: Int8Array;
    nodesCovered: Int8Array;
    nodesTaken: Int8Array;

    nodeAnchor = 0;

    constructor(public width, public height, public cellMinSize) {
        this.nodeX = new Float32Array(this.cellBatchSize);
        this.nodeY = new Float32Array(this.cellBatchSize);
        this.nodeW = new Float32Array(this.cellBatchSize);
        this.nodeH = new Float32Array(this.cellBatchSize);
        this.nodesLevel = new Int8Array(this.cellBatchSize);
        this.nodesCovered = new Int8Array(this.cellBatchSize);
        this.nodesTaken = new Int8Array(this.cellBatchSize);
        this.nodesParent = new Int32Array(this.cellBatchSize);
        this.nodesRef = new Int32Array(this.cellBatchSize * 4);

        this.depth();
        this.rootNode();
    }

    depth() {
        this.cellDepthMax = 0;
        let boundSize = Math.min(this.width, this.height);
        while (boundSize > this.cellMinSize) {
            boundSize /= 2;
            this.cellDepthMax++;
        }

    }

    rootNode() {
        this.newNode(0, this.width / 2, this.height / 2, this.width / 2, this.height / 2, 0);
    }

    newNode(parentIndex, mx: number, my: number, hw: number, hh: number, level: number) {
        this.nodesParent[this.nodeAnchor] = parentIndex;
        this.nodeX[this.nodeAnchor] = mx;
        this.nodeY[this.nodeAnchor] = my;
        this.nodeW[this.nodeAnchor] = hw;
        this.nodeH[this.nodeAnchor] = hh;
        this.nodesLevel[this.nodeAnchor] = level;
        const nodeIndex = this.nodeAnchor;
        this.nodeAnchor++;
        return nodeIndex;
    }


    merge(boundOffset: number) {
        this.nodesRef.fill(0, boundOffset, boundOffset + 4);
    }

    split(nodeIndex: number, indexOffset: number) {
        const nextLevel = this.nodesLevel[nodeIndex] + 1,
            x = this.nodeX[nodeIndex],
            y = this.nodeY[nodeIndex],
            subWidth = this.nodeW[nodeIndex] / 2,
            subHeight = this.nodeH[nodeIndex] / 2;

        this.nodesRef[indexOffset] =
            this.newNode(nodeIndex, x - subWidth, y - subHeight, subWidth, subHeight, nextLevel); //lt
        this.nodesRef[indexOffset + 1] =
            this.newNode(nodeIndex, x + subWidth, y - subHeight, subWidth, subHeight, nextLevel); //rt
        this.nodesRef[indexOffset + 2] =
            this.newNode(nodeIndex, x + subWidth, y + subHeight, subWidth, subHeight, nextLevel); //rb
        this.nodesRef[indexOffset + 3] =
            this.newNode(nodeIndex, x - subWidth, y + subHeight, subWidth, subHeight, nextLevel); //lb

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
    indexToCenter(centerX, centerY, x, y, w = 0, h = 0) {
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

    indexCoveredOnNode(nodeIndex: number, rx: number, ry: number, rw: number, rh: number) {
        return this.indexToCenter(this.nodeX[nodeIndex], this.nodeY[nodeIndex], rx, ry, rw, rh);
    }

    indexPointedOnNode(nodeIndex: number, x: number, y: number) {
        return this.indexToCenter(this.nodeX[nodeIndex], this.nodeY[nodeIndex], x, y);

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
    covered(nodeIndex: number, rx: number, ry: number, rw: number, rh: number) {
        return this.coveredCheck(
            this.nodeX[nodeIndex], this.nodeY[nodeIndex], this.nodeW[nodeIndex], this.nodeH[nodeIndex],
            rx, ry, rw, rh
        )
    }

    coveredCheck(sx, sy, sw, sh, lgx, lgy, lgw, lgh) {
        const diffX = sx - lgx;
        const diffY = sy - lgy;
        const diffW = sw - lgw;
        const diffH = sh - lgh;
        return diffW <= 0 && diffH <= 0 && diffX - diffW >= 0 && diffY - diffH >= 0 && diffX + diffW <= 0 && diffY + diffH <= 0;
    }

    insert(nodeIndex: number, rx, ry, rw, rh) {
        const indexOffset = nodeIndex * 4;
        const newCoverTest = this.covered(nodeIndex, rx, ry, rw, rh);
        if (newCoverTest === true) {
            if (this.nodesCovered[nodeIndex] !== 1) {
                this.merge(indexOffset);
                this.nodesTaken[nodeIndex] = 1;
                this.nodesCovered[nodeIndex] = 1;
            }
        } else {
            if (this.nodesLevel[nodeIndex] < this.cellDepthMax && !this.nodesCovered[nodeIndex] && !this.nodesRef[indexOffset]) {
                this.split(nodeIndex, indexOffset);
            }

            if (this.nodesRef[indexOffset]) {
                const binaryIndexes = this.indexCoveredOnNode(nodeIndex, rx, ry, rw, rh);
                binaryIndexes & 0b1 && this.insert(this.nodesRef[indexOffset], rx, ry, rw, rh);
                binaryIndexes & 0b10 && this.insert(this.nodesRef[indexOffset + 1], rx, ry, rw, rh);
                binaryIndexes & 0b100 && this.insert(this.nodesRef[indexOffset + 2], rx, ry, rw, rh);
                binaryIndexes & 0b1000 && this.insert(this.nodesRef[indexOffset + 3], rx, ry, rw, rh);
            }

            if (this.nodesRef[indexOffset] === 0) {
                this.nodesTaken[nodeIndex] = 1;
            } else {
                this.nodesTaken[nodeIndex] = 0;
            }
        }
    }

    insertBatch(rects: iBound[]) {
        const start = typeof performance === "undefined" ? Date.now() : performance.now();
        rects.forEach(rect => {
            this.insert(0, rect[0], rect[1], rect[2], rect[3]);
        })
        const startUi = typeof performance === "undefined" ? Date.now() : performance.now();
        return startUi - start;
    }

    neighbourTopParentIndex(nodeIndex: number, rx: number, ry: number, rw: number, rh: number): number {
        const parentIndex = this.nodesParent[nodeIndex];
        if (parentIndex === 0)
            return parentIndex;

        const inside = this.coveredCheck(
            rx, ry, rw, rh,
            this.nodeX[parentIndex], this.nodeY[parentIndex], this.nodeW[parentIndex], this.nodeH[parentIndex]);
        if (inside) {
            return parentIndex;
        } else {
            return this.neighbourTopParentIndex(parentIndex, rx, ry, rw, rh);
        }
    }

    neighbourQuery(neighboursIndex: number[], nodeIndex, rx, ry, rw, rh): number[] {
        const indexOffset = nodeIndex * 4;
        const indexOfRect = this.indexCoveredOnNode(nodeIndex, rx, ry, rw, rh);
        if (indexOfRect > 0) {
            if (this.nodesRef[indexOffset] === 0) {
                if (this.nodesTaken[nodeIndex] === 0) {
                    neighboursIndex.push(nodeIndex)
                }
            } else {
                indexOfRect & 0b1 && this.neighbourQuery(neighboursIndex, this.nodesRef[indexOffset], rx, ry, rw, rh);
                indexOfRect & 0b10 && this.neighbourQuery(neighboursIndex, this.nodesRef[indexOffset + 1], rx, ry, rw, rh);
                indexOfRect & 0b100 && this.neighbourQuery(neighboursIndex, this.nodesRef[indexOffset + 2], rx, ry, rw, rh);
                indexOfRect & 0b1000 && this.neighbourQuery(neighboursIndex, this.nodesRef[indexOffset + 3], rx, ry, rw, rh);
            }
        }

        return neighboursIndex;
    }


    neighbours(nodeIndex: number): number[] {
        const extraBound = this.cellMinSize / 2;
        const rx = this.nodeX[nodeIndex],
            ry = this.nodeY[nodeIndex],
            rw = this.nodeW[nodeIndex] + extraBound,
            rh = this.nodeH[nodeIndex] + extraBound;
        const topParent = this.neighbourTopParentIndex(nodeIndex, rx, ry, rw, rh);
        return this.neighbourQuery([], topParent, rx, ry, rw, rh);
    }


    nodeOfPoint(nodeIndex: number, x: number, y: number): number {
        const indexOffset = nodeIndex * 4;
        if (this.nodesRef[indexOffset] === 0) {
            return nodeIndex;
        } else {
            const indexOfPoint = this.indexPointedOnNode(nodeIndex, x, y);
            if (this.nodesRef[indexOffset] > 0 && indexOfPoint > 0) {
                if (indexOfPoint & 0b1) return this.nodeOfPoint(this.nodesRef[indexOffset], x, y);
                else if (indexOfPoint & 0b10) return this.nodeOfPoint(this.nodesRef[indexOffset + 1], x, y);
                else if (indexOfPoint & 0b100) return this.nodeOfPoint(this.nodesRef[indexOffset + 2], x, y);
                else if (indexOfPoint & 0b1000) return this.nodeOfPoint(this.nodesRef[indexOffset + 3], x, y);
            } else {
                return nodeIndex;
            }
        }
    }


    dispose() {
        delete this.nodeX;
        delete this.nodeY;
        delete this.nodeW;
        delete this.nodeH;
        delete this.nodesLevel;
        delete this.nodesCovered;
        delete this.nodesTaken;
        delete this.nodesRef;
    }

    reset() {
        this.nodeX.fill(0);
        this.nodeY.fill(0);
        this.nodeW.fill(0);
        this.nodeH.fill(0);
        this.nodesCovered.fill(0);
        this.nodesLevel.fill(0);
        this.nodesTaken.fill(0);
        this.nodesRef.fill(0);

        this.nodeAnchor = 0;
        this.rootNode();
    }
}
