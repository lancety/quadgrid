import {iBound, iQuadGrid, iQuadNode} from "./quadgrid.type";

export function QuadNode(bound: iBound, level: number): iQuadNode {
    return {
        bound,
        level,
        nodes: [],
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

    insert(node: iQuadNode, rect: iBound) {
        const newCoverTest = this.inside(node.bound, rect);
        if (newCoverTest === true) {
            if (node.covered !== true) {
                this.merge(node);
                node.taken = true;
                node.covered = true;
            }
        } else {
            if (node.level < this.cellDepthMax && !node.covered && !node.nodes.length) {
                this.split(node);
            }

            if (node.nodes.length) {
                this.insertBatch(node, rect, "insert");
            }

            if (node.nodes.length === 0) {
                node.taken = true;
            } else {
                delete node.taken;
            }
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
}
