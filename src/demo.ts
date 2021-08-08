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

/*
* states
* */
const states = {
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


/*
* main
* */

(function render() {
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
    const arrSize = Math.ceil(Math.sqrt(amount));
    const arr = Array(arrSize).fill(null);
    arr.forEach((ignore, r) => {
        arr.forEach((ignore, c) => {
            // const w = _random(min, max) * (large ? 30 : 1) / 2;
            // const h = _random(min, max) * (large ? 30 : 1) / 2;
            const w = _random(min, max) * (large || (amount >= 10 && r < arrSize * 0.2) ? 20 : 1) / 2;
            const h = _random(min, max) * (large || (amount >= 10 && c < arrSize * 0.2) ? 20 : 1) / 2;
            states.rects.push( [
                _random(w, width - w),
                _random(h, height - h),
                w,
                h,
            ] as iBound)


            // const w  =min * (large || (amount >= 10 && r < amount * 0.1) ? 30 : 1) / 2;
            // const h = min * (large || (amount >= 10 && c < amount * 0.1) ? 30 : 1) / 2;
            // states.rects.push( [
            //     w * 3 * r * 1.1 + w,
            //     h * 3 * c * 1.1 + h,
            //     w,
            //     h,
            // ] as iBound)
        })

    })

    const start = performance.now();
    for (let i = 0; i < states.rects.length; i++) {
        grid.insert(grid.root, states.rects[i])
    }
    const startUi = performance.now();
    console.log(`add ${amount} duration`, startUi - start)
    console.log(`allNodes`, grid.allNodes([], grid.root));
}


/*
* render util
* */
function _updateUI() {
    ctx.clearRect(0, 0, width, height);

    document.getElementById("info_count").innerText = states.rects.length + "";

    // draw grid
    _drawGridNodes(grid.root);
    _drawGridTaken(grid.root);
    _drawGridTakenStroke(grid.root);
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
            ctx.fillStyle = "rgba(6, 6, 6, 0.8)";
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
            ctx.strokeStyle = "rgba(152,11,11,0.8)";
            // @ts-ignore
            ctx.strokeRect(..._getBound(node.bound))
        }
    }
}

function _getBound(bound: iBound) {
    return [bound[0] - bound[2], bound[1] - bound[3], bound[2] * 2, bound[3] * 2];
}