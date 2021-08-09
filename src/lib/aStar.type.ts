import {iQuadGrid} from "./quadgrid.type";

export enum eQuadPathHeuristic {
    manhattan = "manhattan",
    euclidean = "euclidean",
    octile = "octile",
    chebyshev = "chebyshev",
}

export enum eDiagonalMovement {
    Always,
    Never,
    IfAtMostOneObstacle,
    OnlyWhenNoObstacles,
}

export interface iAStarProps {
    quadGrid: iQuadGrid,
    heuristic?: eQuadPathHeuristic,
    diagonalMovement?: eDiagonalMovement,
    weight?: number,
}

export interface iAStarGrid {
    nodeAtPoint: () => number,
}

export interface iAStar {
    findPath: (sx: number, sy: number, es: number, ey: number, quadGrid: iQuadGrid) => number[]
}