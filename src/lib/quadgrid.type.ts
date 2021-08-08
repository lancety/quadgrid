export interface iQuadGrid {
    cellItemsMax?: number,
    cellDepthMax?: number,
    cellMinSize?: number,

    nodeX: Float32Array,
    nodeY: Float32Array,
    nodeW: Float32Array,
    nodeH: Float32Array,
    nodesRef: bNode,
    nodesLevel: Int8Array,
    nodesTaken: Int8Array,
    nodesCovered: Int8Array,
}

export type iBound = number[];  // mx, my, hw, hh,

// 0 to 65535
export type bNode = Int32Array;      // [ltId, rtId, rbId, lbId]