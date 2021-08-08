import {QuadGrid} from "./lib/quadgrid";
import {iBound} from "./lib/quadgrid.type";

function _random(min, max) {
    return Math.round(min + (Math.random() * (max - min)));
}

const width = 1200, height = 1000;
const min = 2, max = 10;


const states = {
    rects: [] as iBound[],
}

const grid = new QuadGrid(width, height, 9);
const addNodes = function (amount: number, large = false) {
    states.rects.splice(0);
    grid.reset();
    const arrSize = Math.ceil(Math.sqrt(amount));
    const arr = Array(arrSize).fill(null);
    arr.forEach((ignore, r) => {
        arr.forEach((ignore, c) => {
            // const w = _random(min, max) * (large ? 30 : 1) / 2;
            // const h = _random(min, max) * (large ? 30 : 1) / 2;
            const w = _random(min, max) * (large || (amount >= 10 && r < arrSize * 0.1) ? 20 : 1) / 2;
            const h = _random(min, max) * (large || (amount >= 10 && c < arrSize * 0.1) ? 20 : 1) / 2;
            states.rects.push([
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

    const start = Date.now();
    for (let i = 0; i < states.rects.length; i++) {
        grid.insert(0, states.rects[i])
    }
    const startUi = Date.now();
    console.log(`add ${amount} duration`, startUi - start, startUi, start)
    console.log(`allNodes`, grid.nodeAnchor);
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
