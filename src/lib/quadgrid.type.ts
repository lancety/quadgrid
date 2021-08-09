export interface iQuadGrid {
    cellBatchSize: number,
    cellDepthMax: number,
    cellMinSize: number,

    width: number,
    height: number,

    nodeX: Float32Array,
    nodeY: Float32Array,
    nodeW: Float32Array,
    nodeH: Float32Array,
    nodesParent: bNode;
    nodesRef: bNode,
    nodesLevel: Int8Array,
    nodesTaken: Int8Array,
    nodesCovered: Int8Array,

    nodeAnchor: number,

    nodeOfPoint: (nodeIndex: number, x: number, y: number) => number,
    neighbours: (nodeIndex: number) => number[],
}

export type iBound = number[];  // mx, my, hw, hh,

// 0 to 65535
export type bNode = Int32Array;      // [ltId, rtId, rbId, lbId]