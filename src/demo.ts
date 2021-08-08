import {QuadGrid} from "./lib/quadgrid";
import {iBound} from "./lib/quadgrid.type";
import {makeRects} from "./demoUtil";

const width = 1600, height = 1200;
const min = 2, max = 10;

let maxDepth = 0;
let boundSize = Math.min(width, height);
while (boundSize > min) {
    boundSize /= 2;
    maxDepth++;
}

const grid = (window as any).grid = new QuadGrid(width, height, maxDepth);

/*
* states
* */
const states = {
    rects: [] as iBound[]
}

/*
* init UI
* */
const canvas = document.getElementById("canvas")
canvas.setAttribute("width", width + "");
canvas.setAttribute("height", height + "");
canvas.style.background = "#111";
const ctx = (canvas as HTMLCanvasElement).getContext('2d');


/*
* mouse event
* */


/*
* main
* */

(function render() {
    _updateUI();
    window.requestAnimationFrame(render);
})();


/*
* quadtree util
* */

(window as any).addNodes = function(amount: number, large = false) {
    const rects = states.rects = makeRects(width, height, min, max, amount, large)
    grid.reset();
    const duration = grid.insertBatch(rects)
    console.log(`add ${amount} duration`, duration)
    console.log(`allNodes`, grid.nodeAnchor);
}



/*
* render util
* */
function _updateUI() {
    ctx.clearRect(0, 0, width, height);

    document.getElementById("info_count").innerText = states.rects.length + "";

    // draw grid
    _drawGridNodes();
    _drawGridTaken();
    _drawGridTakenStroke();
}

function _drawGridNodes(nodeIndex?: number) {
    if (nodeIndex === 0) return;
    const boundOffset = (nodeIndex || 0) * 4;
    if (grid.nodesRef[boundOffset]) {
        for (let i = 0; i < 4; i++) {
            _drawGridNodes(grid.nodesRef[boundOffset + i])
        }
    } else {
        if (!grid.nodesTaken[nodeIndex]) {
            ctx.strokeStyle = "rgba(0, 255, 0, 0.4)";
            // @ts-ignore
            ctx.strokeRect(..._getBound(nodeIndex))
        }
    }
}

function _drawGridTaken(nodeIndex?: number) {
    if (nodeIndex === 0) return;
    const boundOffset = (nodeIndex || 0) * 4;
    if (grid.nodesRef[boundOffset]) {
        for (let i = 0; i < 4; i++) {
            _drawGridTaken(grid.nodesRef[boundOffset + i])
        }
    } else {
        if (grid.nodesTaken[nodeIndex]) {
            ctx.fillStyle = "rgba(6, 6, 6, 0.8)";
            // @ts-ignore
            ctx.strokeRect(..._getBound(nodeIndex))
        }
    }
}

function _drawGridTakenStroke(nodeIndex?: number) {
    if (nodeIndex === 0) return;
    const boundOffset = (nodeIndex || 0) * 4;
    if (grid.nodesRef[boundOffset]) {
        for (let i = 0; i < 4; i++) {
            _drawGridTakenStroke(grid.nodesRef[boundOffset + i])
        }
    } else {
        if (grid.nodesTaken[nodeIndex]) {
            ctx.strokeStyle = "rgba(152,11,11,0.8)";
            // @ts-ignore
            ctx.strokeRect(..._getBound(nodeIndex))
        }
    }
}

function _getBound(nodeIndex) {
    const {nodeX, nodeY, nodeW, nodeH} = grid;
    const x = nodeX[nodeIndex];
    const y = nodeY[nodeIndex];
    const w = nodeW[nodeIndex];
    const h = nodeH[nodeIndex];
    return [x - w, y - h, w * 2, h * 2];
}