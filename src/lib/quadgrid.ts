import {iBound, iQuadGridFactory, iQuadNode} from "./quadgrid.type";

export function QuadNode (bound: iBound, level: number): iQuadNode {
    return {
        bound,
        level,
        nodes: [],
        rects: [],
    }
}

export class QuadGridFactory implements iQuadGridFactory {
    root: iQuadNode;
    rects: iBound[] = [];

    constructor(public width, public height,
                public cellDepthMax = 6, public cellObjMax = 10) {
        this.root = QuadNode([0, 0, width, height], 0);
    }

    split(node: iQuadNode) {
        const nextLevel = node.level + 1,
            subWidth = node.bound[2] / 2,
            subHeight = node.bound[3] / 2,
            x = node.bound[0],
            y = node.bound[1];

        //lt
        node.nodes[0] = QuadNode([
            x,
            y,
            subWidth,
            subHeight
        ], nextLevel);

        //rt
        node.nodes[1] = QuadNode([
            x + subWidth,
            y,
            subWidth,
            subHeight
        ], nextLevel);

        //rb
        node.nodes[2] = QuadNode([
            x + subWidth,
            y + subHeight,
            subWidth,
            subHeight
        ], nextLevel);

        //lb
        node.nodes[3] = QuadNode([
            x,
            y + subHeight,
            subWidth,
            subHeight
        ], nextLevel);
    }

    getIndex(node: iQuadNode, rect: iBound) {
        let indexes = 0b0,
            verticalMidpoint = node.bound[0] + (node.bound[2] / 2),
            horizontalMidpoint = node.bound[1] + (node.bound[3] / 2);

        const startIsNorth = rect[1] < horizontalMidpoint,
            startIsWest = rect[0] < verticalMidpoint,
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
        node.nodes.splice(0);
        node.rects.push(...this.objectsAll([], node));
    }

    inside(bound: iBound, rect: iBound) {
        return bound[0] > rect[0] && bound[1] > rect[1] &&
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

    insertAsGrid(node: iQuadNode, rect: iBound) {
        this.rects.push(rect);

        const newCoverTest = this.inside(node.bound, rect);
        if (newCoverTest === true) {
            if (node.covered !== true) {
                this.merge(node);
                node.taken = true;
                node.covered = true;
            }
            node.rects.push(rect);
            return;
        }

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
    }

    insertAsTree(node: iQuadNode, rect: iBound) {
        this.rects.push(rect);

        if (node.nodes.length) {
            this.insertBatch(node, rect, "insertAsTree");
            return;
        }

        node.rects.push(rect);
        if (node.rects.length > this.cellObjMax && node.level < this.cellDepthMax) {
            if (!node.nodes.length) {
                this.split(node);
            }

            node.rects.forEach(bound =>
                this.insertBatch(node, bound, "insertAsTree")
            )

            node.rects.splice(0);
        }
    }

    objectsAll(rectStore: iBound[], node: iQuadNode): iBound[] {
        if (node.nodes.length > 0) {
            node.nodes.forEach(n => {
                this.objectsAll(rectStore, n);
            })
        } else {
            rectStore.push(...node.rects);
        }
        return rectStore;
    }

    retrieve(node: iQuadNode, bound: iBound, rectStore?: iBound[]): Set<iBound> {
        const indexes = this.getIndex(node, bound);
        const store = rectStore || [];
        store.push(...node.rects);

        if (node.nodes.length) {
            indexes & 0b1 && this.retrieve(node.nodes[0], bound, store);
            indexes & 0b10 && this.retrieve(node.nodes[1], bound, store);
            indexes & 0b100 && this.retrieve(node.nodes[2], bound, store);
            indexes & 0b1000 && this.retrieve(node.nodes[3], bound, store);
        }

        if (store.length > 0) {
            console.log("111")
        }

        if (rectStore) {
            rectStore.push(...store);
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
