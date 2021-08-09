import {iQuadGrid} from "./quadgrid.type";

export enum eQuadPathHeuristic {
    manhattan = "manhattan",
    euclidean = "euclidean",
    octile = "octile",
    chebyshev = "chebyshev",
}

export interface iAStarProps {
    quadGrid: iQuadGrid,
    heuristic?: eQuadPathHeuristic,
    weight?: number,
}

export interface iAStarGrid {
    nodeAtPoint: () => number,
}

export interface iAStar {
    ps: (sx: number, sy: number, es: number, ey: number, quadGrid: iQuadGrid, collideRadius?: number) => number[]
}