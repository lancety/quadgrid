export interface iQuadGridFactory {
    cellItemsMax?: number,
    cellDepthMax?: number,
    root: iQuadNode;
    rects: iBound[];
}

export interface iQuadNode {
    bound: iBound,      // bound of this node
    level: number,      // this node's level
    rects: iBound[],  // iBound rect
    nodes: iQuadNode[], // 4 child nodes
    covered?: boolean,   // node is totally inside a bound area
    taken?: boolean,     // node has at least one bound object
}

export type iBound = number[];  // x, y, width, height,