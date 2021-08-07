import {QuadGridFactory} from "./lib/quadgrid";
import {iBound, iQuadNode} from "./lib/quadgrid.type";

const width = 1200, height = 800;
const min = 2, max = 10;

let maxDepth = 0, maxItems = 2;
let boundSize = Math.min(width, height);
while (boundSize > min) {
    boundSize /= 2;
    maxDepth++;
}

const factory = new QuadGridFactory(width, height, maxDepth, maxItems);
const focus = [0, 0, 50, 50];

/*
* states
* */
const states = {
    activeRects: new Set() as Set<iBound>,
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
        states.activeRects = factory.retrieve(factory.root, focus);
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
    const rects = Array(amount).fill(null).map((ignore, ind) => {
        return [
            _random(0, width - max),
            _random(0, height - max),
            // _random(min, max),
            // _random(min, max),
            _random(min, max) * (large || (amount >= 10 && ind < amount * 0.1) ? 10 : 1),
            _random(min, max) * (large || (amount >= 10 && ind > amount * 0.9) ? 10 : 1),
        ] as iBound
    })

    const start = performance.now();
    for (let i = 0; i < rects.length; i++) {
        factory.insertAsGrid(factory.root, rects[i])
        // factory.insertAsTree(factory.root, rects[i])
    }
    const startUi = performance.now();
    console.log(`add ${amount} duration`, startUi - start)
    _updateUI();
    console.log(`ui ${amount} duration`, performance.now() - startUi)
}


/*
* render util
* */
function _updateUI() {
    ctx.clearRect(0, 0, width, height);

    document.getElementById("info_count").innerText = factory.rects.length + "";
    document.getElementById("info_involved").innerText = (states.activeRects?.size || 0) + "";

    // draw focus rect
    if (mouseOn) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        // @ts-ignore
        ctx.fillRect(...focus);
    }

    // draw grid
    _drawGridNodes(factory.root);
    _drawGridTaken(factory.root);

    // draw objects
    factory.rects.forEach(bound => {
        if (states.activeRects.has(bound)) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            // @ts-ignore
            ctx.fillRect(...bound);
        } else {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            // @ts-ignore
            ctx.strokeRect(...bound)
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
            ctx.strokeRect(...node.bound)
        }
    }
}

function _drawGridTaken(node: iQuadNode) {
    if (node.nodes.length) {
        node.nodes.forEach(node => _drawGridTaken(node));
    } else {
        if (node.taken) {
            ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillStyle = "rgba(255,255,255, 0.8)";
            // @ts-ignore
            ctx.fillRect(...node.bound)
        }
    }
}