export interface iQuadGrid {
    cellItemsMax?: number,
    cellDepthMax?: number,
    cellMinSize?: number,
    root: iQuadNode;

    // rectBounds: bBound,
    // nodeBounds: bBound,
    // nodes: bNode,
    // nodesMap: bNodeMap,
    // rectsMap: ,
}


export interface iQuadNode {
    bound: iBound,      // bound of this node
    level: number,      // this node's level
    nodes: iQuadNode[], // 4 child nodes
    rects?: iBound[],  // iBound , only quadTree need it, quadGrid dont need
    covered?: boolean,   // node is totally inside a bound area
    taken?: boolean,     // node has at least one bound object
}


export type iBound = number[];  // x, y, width, height,

// 0 to 65535
export type bBound = Int16Array;    // [mx, my, hw, hh]
export type bNode = Int8Array;     // [level, covered, taken]
export type bNodeMap = Int32Array;     // [ltId, rtId, rbId, lbId]