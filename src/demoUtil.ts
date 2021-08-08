import {iBound} from "./lib/quadgrid.type";

function _random(min, max) {
    return Math.round(min + (Math.random() * (max - min)));
}

export const makeRects = function (width, height, min, max, amount: number, large = false) {
    const rects = []


    for (let i =0 ;i<amount; i++) {
        const w = _random(min, max) * (large ? 30 : 1) / 2;
        const h = _random(min, max) * (large ? 30 : 1) / 2;
        // const w = _random(min, max) * (large || (amount >= 10 && i < amount * 0.1) ? 20 : 1) / 2;
        // const h = _random(min, max) * (large || (amount >= 10 && i < amount * 0.1) ? 20 : 1) / 2;
        rects.push([
            _random(w, width - w),
            _random(h, height - h),
            w,
            h,
        ] as iBound)
    }


    // const arrSize = Math.ceil(Math.sqrt(amount));
    // const arr = Array(arrSize).fill(null);
    // arr.forEach((ignore, r) => {
    //     arr.forEach((ignore, c) => {
    //         const w  =min * (large || (amount >= 10 && r < amount * 0.1) ? 30 : 1) / 2;
    //         const h = min * (large || (amount >= 10 && c < amount * 0.1) ? 30 : 1) / 2;
    //         rects.push( [
    //             w * 3 * r * 1.1 + w,
    //             h * 3 * c * 1.1 + h,
    //             w,
    //             h,
    //         ] as iBound)
    //     })
    //
    // })

    return rects;
}