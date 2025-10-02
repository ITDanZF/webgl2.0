// filepath: /Users/jinyuhe/Documents/OpenSourceCode/webgl/webgl2.0/js/utils.js
import Check from './Check.js';

/**
 * 如果是二维数组(形如 [[...],[...]] )则拍平为一维；
 * 其他类型(含 TypedArray / 空数组 / 已是一维)原样返回。
 * @param {*} arr
 * @returns {*}
 */
export function flattenIf2D(arr) {
    if (!Array.isArray(arr)) return arr;
    if (arr.length === 0) return arr;
    if (Array.isArray(arr[0])) {
        const out = [];
        for (let i = 0; i < arr.length; i++) out.push(...arr[i]);
        return out;
    }
    return arr;
}

/**
 * 转换输入为 Float32Array；
 * - Float32Array: 直接返回
 * - Float64Array: 拷贝为 Float32Array
 * - 普通数组: 构造 Float32Array
 * 其它类型抛错。
 * @param {*} arr
 * @returns {Float32Array}
 */
export function toFloat32(arr) {
    if (Check.isFloat32Array(arr)) return arr;
    if (Check.isFloat64Array(arr)) return new Float32Array(arr);
    if (Array.isArray(arr)) return new Float32Array(arr);
    throw new Error('toFloat32: Unsupported data type, expected Array|Float32Array|Float64Array');
}

