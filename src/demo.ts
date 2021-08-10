import {QuadGrid} from "./lib/quadgrid";
import {iBound} from "./lib/quadgrid.type";
import {makeRects} from "./demoUtil";
import {QuadPath} from "./lib/quadpath";
import {eQuadPathHeuristic} from "./lib/aStar.type";

const width = 1280, height = 1280;
const min = 2, max = 10;


const grid = (window as any).grid = new QuadGrid(width, height, min);
const path = (window as any).path = new QuadPath({
    finderConfig: {
        quadGrid: grid,
        heuristic: eQuadPathHeuristic.manhattan,
    }
})

/*
* states
* */
const states = {
    rects: [] as iBound[],
    focus: [0, 0],
    focusActive: false,
    neighbours: new Set(),
    pathFrom: [1, 1],
    pathTo: undefined,
    pathToNode: undefined,
    path: [],
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
canvas.addEventListener("mousemove", function (e: any) {
    states.focusActive = true;
    if (!e.offsetX) {
        e.offsetX = e.layerX - e.target.offsetLeft;
        e.offsetY = e.layerY - e.target.offsetTop;
    }
    states.focus = [e.offsetX, e.offsetY];
    const nodeIndex = grid.np(0, e.offsetX, e.offsetY);
    states.pathTo = [grid.xs[nodeIndex], grid.ys[nodeIndex]];

    if (states.pathToNode !== nodeIndex) {
        console.log(`node ${nodeIndex}, x ${grid.xs[nodeIndex]}, y ${grid.ys[nodeIndex]}, w ${grid.ws[nodeIndex]}, h ${grid.hs[nodeIndex]}`);

        states.pathToNode = nodeIndex;
        path.ps(states.path, states.pathFrom[0], states.pathFrom[1], states.pathTo[0], states.pathTo[1], grid, 20);
    }
});
canvas.addEventListener("mouseout", function (e) {
    states.focusActive = false;
});

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

(window as any).addNodes = function (amount: number, large = false) {
    states.rects.push(...makeRects(width, height, min, max, amount, large));
    const duration = grid.ins(states.rects)
    console.log(`add ${amount} duration`, duration)
    console.log(`allNodes`, grid.a);
}


/*
* render util
* */
function _updateUI() {
    ctx.clearRect(0, 0, width, height);
    document.getElementById("info_count").innerText = states.rects.length + "";

    states.neighbours.clear();
    if (states.focusActive) {
        const nodeOfPoint = grid.np(0, states.focus[0], states.focus[1]);
        // console.log(states.focus, grid.nodeX[nodeOfPoint], grid.nodeY[nodeOfPoint], grid.nodeW[nodeOfPoint], grid.nodeH[nodeOfPoint], grid.nodesLevel[nodeOfPoint])
        grid.ts[nodeOfPoint] === 0 && grid.nbs(nodeOfPoint).forEach(neighbourIndex => {
            states.neighbours.add(neighbourIndex);
        })

        _drawPath();
    }

    // draw grid
    _drawGridActive();
    _drawGridNodes();
    _drawGridTaken();
    _drawGridTakenStroke();
}

function _drawPath() {
    if (states.pathTo) {
        if (states.path === undefined) return;

        ctx.strokeStyle = "rgb(251,255,0)";
        ctx.beginPath();
        ctx.moveTo(states.pathFrom[0], states.pathFrom[1]);
        states.path.forEach(coord => {
            ctx.lineTo(coord[0], coord[1]);
        })
        ctx.stroke();
    }
}

function _drawGridActive(nodeIndex?: number) {
    if (nodeIndex === 0) return;
    const boundOffset = (nodeIndex || 0) * 4;
    if (grid.ms[boundOffset]) {
        for (let i = 0; i < 4; i++) {
            _drawGridActive(grid.ms[boundOffset + i])
        }
    } else {
        if (states.neighbours.has(nodeIndex)) {
            ctx.fillStyle = "rgb(220,33,255, 0.6)";
            // @ts-ignore
            ctx.fillRect(..._getBound(nodeIndex))
        }
    }
}

function _drawGridNodes(nodeIndex?: number) {
    if (nodeIndex === 0) return;
    const boundOffset = (nodeIndex || 0) * 4;
    if (grid.ms[boundOffset]) {
        for (let i = 0; i < 4; i++) {
            _drawGridNodes(grid.ms[boundOffset + i])
        }
    } else {
        if (!grid.ts[nodeIndex]) {
            ctx.strokeStyle = "rgba(0, 255, 0, 0.4)";
            // @ts-ignore
            ctx.strokeRect(..._getBound(nodeIndex))
        }
    }
}

function _drawGridTaken(nodeIndex?: number) {
    if (nodeIndex === 0) return;
    const boundOffset = (nodeIndex || 0) * 4;
    if (grid.ms[boundOffset]) {
        for (let i = 0; i < 4; i++) {
            _drawGridTaken(grid.ms[boundOffset + i])
        }
    } else {
        if (grid.ts[nodeIndex]) {
            ctx.fillStyle = "rgba(6, 6, 6, 0.8)";
            // @ts-ignore
            ctx.fillRect(..._getBound(nodeIndex))
        }
    }
}

function _drawGridTakenStroke(nodeIndex?: number) {
    if (nodeIndex === 0) return;
    const boundOffset = (nodeIndex || 0) * 4;
    if (grid.ms[boundOffset]) {
        for (let i = 0; i < 4; i++) {
            _drawGridTakenStroke(grid.ms[boundOffset + i])
        }
    } else {
        if (grid.ts[nodeIndex]) {
            ctx.strokeStyle = "rgba(152,11,11,0.8)";
            // @ts-ignore
            ctx.strokeRect(..._getBound(nodeIndex))
        }
    }
}

function _getBound(nodeIndex) {
    const {xs, ys, ws, hs} = grid;
    const x = xs[nodeIndex];
    const y = ys[nodeIndex];
    const w = ws[nodeIndex];
    const h = hs[nodeIndex];
    return [x - w, y - h, w * 2, h * 2];
}