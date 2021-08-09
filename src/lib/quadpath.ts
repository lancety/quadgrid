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
     * @param {number} collideRadius    float half size of longer side of rect
     * @returns {number[]}
     */
    public findPath(sx, sy, es, ey, grid: iQuadGrid, collideRadius?: number): number[] {
        const start = typeof performance === "undefined" ? Date.now() : performance.now();
        const path = this._finder.findPath(sx, sy, es, ey, grid, collideRadius / Math.SQRT2);
        console.log("findPath takes", typeof performance === "undefined" ? Date.now() : performance.now() - start);

        return path;
    }
}