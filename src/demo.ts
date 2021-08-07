import {QuadGrid} from "./lib/quadgrid";
import {iBound, iQuadNode} from "./lib/quadgrid.type";

const width = 1200, height = 1000;
const min = 2, max = 10;

let maxDepth = 0, maxItems = 2;
let boundSize = Math.min(width, height);
while (boundSize > min) {
    boundSize /= 2;
    maxDepth++;
}

const grid = new QuadGrid(width, height, maxDepth, maxItems);
const focus = [0, 0, 50, 50];

/*
* states
* */
const states = {
    activeRects: new Set() as Set<iBound>,
    rects: [] as iBound[],
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
let mouseOn = false;
canvas.addEventListener("mousemove", function (e: any) {
    mouseOn = true;
    if (!e.offsetX) {
        e.offsetX = e.layerX - e.target.offsetLeft;
        e.offsetY = e.layerY - e.target.offsetTop;
    }
    focus[0] = e.offsetX - (focus[2] / 2);
    focus[1] = e.offsetY - (focus[3] / 2);
});
canvas.addEventListener("mouseout", function (e) {
    mouseOn = false;
});


/*
* main
* */

(function render() {
    if (mouseOn) {
        states.activeRects.clear();
        states.activeRects = grid.retrieve(grid.root, focus);
    }
    _updateUI();
    window.requestAnimationFrame(render);
})()


/*
* quadtree util
* */
function _random(min, max) {
    return Math.round(min + (Math.random() * (max - min)));
}

(window as any).addNodes = function (amount: number, large = false) {
    states.rects.push(...Array(amount).fill(null).map((ignore, ind) => {
        // const w = _random(min, max) * (large ? 30 : 1);
        // const h = _random(min, max) * (large ? 30 : 1);
        const w = _random(min, max) * (large || (amount >= 10 && ind < amount * 0.1) ? 30 : 1) / 2;
        const h = _random(min, max) * (large || (amount >= 10 && ind < amount * 0.1) ? 30 : 1) / 2;
        return [
            _random(w, width - w),
            _random(h, height - h),
            w,
            h,
        ] as iBound
    }))

    const start = performance.now();
    for (let i = 0; i < states.rects.length; i++) {
        grid.insertAsGrid(grid.root, states.rects[i])
        // grid.insertAsTree(grid.root, states.rects[i])
    }
    const startUi = performance.now();
    console.log(`add ${amount} duration`, startUi - start)
    console.log(`allNodes`, grid.allNodes([], grid.root));
    console.log(`times`, grid._times.length / 3, grid._times);
    console.log(`timesCovered`, grid._timesCovered.length / 3, grid._timesCovered);
}


/*
* render util
* */
function _updateUI() {
    ctx.clearRect(0, 0, width, height);

    document.getElementById("info_count").innerText = states.rects.length + "";
    document.getElementById("info_involved").innerText = (states.activeRects?.size || 0) + "";

    // draw focus rect
    if (mouseOn) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        // @ts-ignore
        ctx.fillRect(...focus);
    }

    // draw grid
    _drawGridNodes(grid.root);
    _drawGridTaken(grid.root);
    _drawGridTakenStroke(grid.root);

    // draw objects
    states.rects.forEach(rects => {
        if (states.activeRects.has(rects)) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            // @ts-ignore
            ctx.fillRect(...rects);
        } else {
            ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
            // @ts-ignore
            ctx.strokeRect(...rects)
        }
    })
}

function _drawGridNodes(node: iQuadNode) {
    if (node.nodes.length) {
        node.nodes.forEach(node => _drawGridNodes(node));
    } else {
        if (!node.taken) {
            ctx.strokeStyle = "rgba(0, 255, 0, 0.4)";
            // @ts-ignore
            ctx.strokeRect(..._getBound(node.bound))
        }
    }
}

function _drawGridTaken(node: iQuadNode) {
    if (node.nodes.length) {
        node.nodes.forEach(node => _drawGridTaken(node));
    } else {
        if (node.taken) {
            ctx.fillStyle = "rgba(255,255,255, 0.8)";
            // @ts-ignore
            ctx.fillRect(..._getBound(node.bound))
        }
    }
}

function _drawGridTakenStroke(node: iQuadNode) {
    if (node.nodes.length) {
        node.nodes.forEach(node => _drawGridTakenStroke(node));
    } else {
        if (node.taken) {
            ctx.strokeStyle = "rgba(6, 6, 6, 0.8)";
            // @ts-ignore
            ctx.strokeRect(..._getBound(node.bound))
        }
    }
}

function _getBound(bound: iBound) {
    return [bound[0] - bound[2], bound[1] - bound[3], bound[2] * 2, bound[3] * 2];
}