import {iBound, iQuadGrid, iQuadNode} from "./quadgrid.type";

export function QuadNode(bound: iBound, level: number): iQuadNode {
    return {
        bound,
        level,
        nodes: [],
        rects: [],
    }
}

export class QuadGrid implements iQuadGrid {
    root: iQuadNode;
    cellMinSize: number;

    constructor(public width, public height,
                public cellDepthMax = 6, public cellItemsMax = 10) {
        this.cellMinSize = Math.min(width, height) / Math.pow(2, cellDepthMax);
        this.root = QuadNode([width / 2, height / 2, width / 2, height / 2], 0);
    }

    split(node: iQuadNode) {
        const nextLevel = node.level + 1,
            x = node.bound[0],
            y = node.bound[1],
            subWidth = node.bound[2] / 2,
            subHeight = node.bound[3] / 2;

        node.nodes.push(
            //lt
            QuadNode([
                x - subWidth,
                y - subHeight,
                subWidth,
                subHeight
            ], nextLevel),

            //rt
            QuadNode([
                x + subWidth,
                y - subHeight,
                subWidth,
                subHeight
            ], nextLevel),

            //rb
            QuadNode([
                x + subWidth,
                y + subHeight,
                subWidth,
                subHeight
            ], nextLevel),

            //lb
            QuadNode([
                x - subWidth,
                y + subHeight,
                subWidth,
                subHeight
            ], nextLevel),)
    }

    getIndex(node: iQuadNode, rect: iBound) {
        let indexes = 0b0,
            verticalMidpoint = node.bound[0] ,
            horizontalMidpoint = node.bound[1];

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

    merge(node: iQuadNode) {
        node.rects.push(...this.allRects([], node));
        node.nodes.splice(0);
    }

    inside(bound: iBound, rect: iBound) {
        return bound[0] - bound[2] > rect[0] - rect[2] && bound[1] - bound[3] > rect[1] - rect[3] &&
            bound[0] + bound[2] < rect[0] + rect[2] &&
            bound[1] + bound[3] < rect[1] + rect[3];
    }

    insertBatch(node: iQuadNode, rect: iBound, method: string) {
        const binaryIndexes = this.getIndex(node, rect);
        binaryIndexes & 0b1 && this[method](node.nodes[0], rect);
        binaryIndexes & 0b10 && this[method](node.nodes[1], rect);
        binaryIndexes & 0b100 && this[method](node.nodes[2], rect);
        binaryIndexes & 0b1000 && this[method](node.nodes[3], rect);
    }

    _times = [];
    _timesCovered = [];

    insertAsGrid(node: iQuadNode, rect: iBound) {
        const newCoverTest = this.inside(node.bound, rect);
        if (newCoverTest === true) {
            if (node.covered !== true) {
                this.merge(node);
                node.taken = true;
                node.covered = true;
            }
            node.rects.push(rect);
            this._timesCovered.push(performance.now(), node.bound, node.level);
        } else {
            node.rects.push(rect);
            if (node.nodes.length) {
                this.insertBatch(node, rect, "insertAsGrid");
                node.rects.splice(0);
            } else if (node.covered !== true) {
                if (node.level < this.cellDepthMax) {
                    this.split(node);
                    node.rects.forEach(rect => {
                        this.insertBatch(node, rect, "insertAsGrid");
                    })

                    node.rects.splice(0);
                }
            }

            if (node.nodes.length === 0 && node.rects.length > 0) {
                node.taken = true;
            } else {
                delete node.taken;
            }
            this._times.push(performance.now(), node.bound, node.level);
        }
    }

    insertAsTree(node: iQuadNode, rect: iBound) {

        if (node.nodes.length) {
            this.insertBatch(node, rect, "insertAsTree");
            return;
        }

        node.rects.push(rect);
        if (node.rects.length > this.cellItemsMax && node.level < this.cellDepthMax) {
            if (!node.nodes.length) {
                this.split(node);
            }

            node.rects.forEach(rect =>
                this.insertBatch(node, rect, "insertAsTree")
            )

            node.rects.splice(0);
        }
    }

    allNodes(nodeStore: iQuadNode[], node: iQuadNode): iQuadNode[] {
        if (node.nodes.length > 0) {
            node.nodes.forEach(n => {
                this.allNodes(nodeStore, n);
            })
        } else {
            nodeStore.push(node);
        }
        return nodeStore;
    }

    allRects(rectStore: iBound[], node: iQuadNode): iBound[] {
        if (node.nodes.length > 0) {
            node.nodes.forEach(n => {
                this.allRects(rectStore, n);
            })
        } else {
            rectStore.push(...node.rects);
        }
        return rectStore;
    }

    retrieve(node: iQuadNode, bound: iBound, rectStore?: iBound[]): Set<iBound> {
        const indexes = this.getIndex(node, bound);
        const store = rectStore || [];

        if (node.nodes.length) {
            indexes & 0b1 && this.retrieve(node.nodes[0], bound, store);
            indexes & 0b10 && this.retrieve(node.nodes[1], bound, store);
            indexes & 0b100 && this.retrieve(node.nodes[2], bound, store);
            indexes & 0b1000 && this.retrieve(node.nodes[3], bound, store);
        }

        if (rectStore) {
            node.nodes.length === 0 && rectStore.push(...node.rects);
        } else {
            return new Set(store);
        }
    }

    clear() {
        this.root.nodes.splice(0);
        this.root.rects.splice(0);
        delete this.root.taken;
        delete this.root.covered;
    }
}
