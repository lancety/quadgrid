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
     * @param sx
     * @param sy
     * @param es
     * @param ey
     * @param {iQuadGrid} grid
     * @param {number} collideBody    float half size of longer side of rect
     * @returns {number[]}
     */
    public ps(sx, sy, es, ey, grid: iQuadGrid, collideBody?: number): number[][] {
        const start = typeof performance === "undefined" ? Date.now() : performance.now();
        const path = this._finder.ps(sx, sy, es, ey, grid, collideBody / 2);
        console.log("findPath takes", typeof performance === "undefined" ? Date.now() : performance.now() - start);

        return this.out(path, grid);
    }

    public out(path: number[], grid: iQuadGrid): number[][] {
        return path.map(node => {
            // smooth / shorten path inside node

            // normal case
            return [grid.xs[node], grid.ys[node]]
        })
    }
}