export interface iQuadGrid {
    cellItemsMax?: number,
    cellDepthMax?: number,
    cellMinSize?: number,

    nodeBounds: bBound,
    nodesInfo: bNodeInfo,
    nodesRef: bNode,
}


export interface iQuadNode {
    bound: iBound,      // bound of this node
    level: number,      // this node's level
    nodes?: iQuadNode[], // 4 child nodes
    rects?: iBound[],  // iBound , only quadTree need it, quadGrid dont need
    covered?: boolean,   // node is totally inside a bound area
    taken?: boolean,     // node has at least one bound object
}


export type iBound = number[];  // x, y, width, height,

// 0 to 65535
export type bBound = Float32Array;    // [mx, my, hw, hh]
export type bNode = Int32Array;      // [ltId, rtId, rbId, lbId]
export type bNodeInfo = Int8Array;     // [level, covered, taken]

export const epNodeInfo = {
    level: 0,
    covered: 1,
    taken: 2,
}