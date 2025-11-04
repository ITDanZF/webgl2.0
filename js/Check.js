export default class Check {

    // 判断是否为 null 或 undefined
    static isNull(value) {
        return value === null || value === undefined;
    }

    // 判断是否为空（字符串、数组、对象）
    static isEmpty(value) {
        if (Check.isNull(value)) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    // 判断是否为字符串
    static isString(value) {
        return typeof value === 'string';
    }

    // 判断是否为数字且非 NaN
    static isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    }

    // 判断是否为数组
    static isArray(value) {
        return Array.isArray(value);
    }

    // 判断是否为一维数组
    static isOneDimensionalArray(value) {
        return Array.isArray(arr) && arr.every(v => !Array.isArray(v));
    }

    // 判断是否为二维数组
    static isTwoDimensionalArray(value) {
        return Array.isArray(arr) && arr.length > 0 && arr.every(Array.isArray);
    }


    // 判断是否为对象（非数组、非 null）
    static isObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    // 判断是否为函数
    static isFunction(value) {
        return typeof value === 'function';
    }

    // 判断是否为布尔值
    static isBoolean(value) {
        return typeof value === 'boolean';
    }

    // 判断是否为正整数
    static isPositiveInteger(value) {
        return Check.isNumber(value) && Number.isInteger(value) && value > 0;
    }

    // 判断是否为 Float32Array
    static isFloat32Array(value) {
        return value instanceof Float32Array;
    }

    // 判断是否为 Float64Array
    static isFloat64Array(value) {
        return value instanceof Float64Array;
    }
}