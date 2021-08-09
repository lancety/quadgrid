import {QuadGrid} from "./lib/quadgrid";
import {makeRects} from "./demoUtil";
import {iBound} from "./lib/quadgrid.type";

function _random(min, max) {
    return Math.round(min + (Math.random() * (max - min)));
}

const width = 1600, height = 1200;
const min = 2, max = 10;


const states = {
    rects: [] as iBound[],
}

const grid = new QuadGrid(width, height, 9);
const addNodes = function(amount: number, large = false) {
    const rects = states.rects = makeRects(width, height, min, max, amount, large)
    grid.reset();
    const duration = grid.ins(rects)
    console.log(`add ${amount} duration`, duration)
    console.log(`allNodes`, grid.a);
}


let a = 0;
const iv = setInterval(()=>{
    grid.reset();
    a++;
    addNodes(100);
    if ( a > 10) {
        clearInterval(iv);
    }
}, 500)
