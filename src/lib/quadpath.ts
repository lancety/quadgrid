import {iQuadPathProps} from "./quadpath.type";
import {iAStar} from "./aStar.type";
import {AStarFinder} from "./aStar";
import {iQuadGrid} from "./quadgrid.type";

export class QuadPath {
    private _finder: iAStar;

    constructor(opt: iQuadPathProps) {
        this._finder = new AStarFinder(opt.finderConfig);
    }

    /**
     *
     * @param path
     * @param sx
     * @param sy
     * @param es
     * @param ey
     * @param {iQuadGrid} grid
     * @param {number} collideBody    float half size of longer side of rect
     * @returns {number[]}
     */
    public ps(path: number[][], sx, sy, es, ey, grid: iQuadGrid, collideBody?: number): number[][] {
        path.splice(0);
        const start = typeof performance === "undefined" ? Date.now() : performance.now();
        const nodePath = this._finder.ps(sx, sy, es, ey, grid, collideBody / 2);
        console.log("findPath takes", typeof performance === "undefined" ? Date.now() : performance.now() - start);

        path.push(...this.out(nodePath, grid));
        return path;
    }

    public out(path: number[], grid: iQuadGrid): number[][] {
        return path.map(node => {
            // replace start node with sx, sy

            // replace end node with ex, ey

            // smooth / shorten path inside node

            // normal case
            return [grid.xs[node], grid.ys[node]]
        })
    }
}