import {AStarBFSFinder} from "./aStarBFS";
import {iQuadPathProps} from "./quadpath.type";
import {iAStar} from "./aStar.type";

export class QuadPath {
    private _finder: iAStar;

    constructor(opt: iQuadPathProps) {
        this._finder= new AStarBFSFinder(opt.finderConfig);
    }

    public findPath(sx, sy, es, ey, grid): number[] {
        const start = typeof performance === "undefined" ? Date.now() : performance.now();
        const path = this._finder.findPath(sx, sy, es, ey, grid);
        console.log("findPath takes", typeof performance === "undefined" ? Date.now() : performance.now() - start);

        return path;
    }
}