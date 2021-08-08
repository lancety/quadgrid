export interface iQuadGrid {
    cellItemsMax?: number,
    cellDepthMax?: number,
    cellMinSize?: number,

    nodeBounds: bBound,
    nodesRef: bNode,
    nodesLevel: Int8Array,
    nodesTaken: Int8Array,
    nodesCovered: Int8Array,
}


export interface iQuadNode {
    bound: iBound,      // bound of this node
    level: number,      // this node's level
    nodes?: iQuadNode[], // 4 child nodes
    rects?: iBound[],  // iBound , only quadTree need it, quadGrid dont need
    covered?: boolean,   // node is totally inside a bound area
    taken?: boolean,     // node has at least one bound object
}


export type iBound = number[];  // mx, my, hw, hh,

// 0 to 65535
export type bBound = Float32Array;    // [mx, my, hw, hh]
export type bNode = Int32Array;      // [ltId, rtId, rbId, lbId]