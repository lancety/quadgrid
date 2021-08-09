import {iAStarProps} from "./aStar.type";
import {AStarFinder} from "./aStar";

export class AStarBFSFinder extends AStarFinder {
    constructor(props: iAStarProps) {
        super(props);

        const orig = this._heuristic;
        this._heuristic = function(dx, dy) {
            return orig(dx, dy) * 1000000;
        };
    }
}