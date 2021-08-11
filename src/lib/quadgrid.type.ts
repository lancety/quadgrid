export interface iQuadGrid {
    _cellBatchSize: number,
    _cellDepthMax: number,
    cellMinSize: number,

    width: number,
    height: number,

    xs: Float32Array,
    ys: Float32Array,
    ws: Float32Array,
    hs: Float32Array,
    ps: bNode;
    ms: bNode,
    ls: Int8Array,
    ts: Int8Array,
    cs: Int8Array,

    a: number,

    npt: (nodeIndex: number, x: number, y: number) => number,
    np: (nodeIndex: number, x, y, w, h) => number,
    nbq: (neighboursIndex: number[], nodeIndex, rx, ry, rw, rh, minNeighbourRadius?: number) => number[],
    nbs: (nodeIndex: number, minNeightbourRadius?: number) => number[],
    nbcq: (neighboursIndex: number[], nodeIndex, rx, ry, rw, rh) => number[],
    nbc: (nodeIndex: number, collideRadius: number) => boolean,
    rc: (x, y, w, h) => boolean,
}

export type iBound = number[];  // mx, my, hw, hh,

// 0 to 65535
export type bNode = Int32Array;      // [ltId, rtId, rbId, lbId]