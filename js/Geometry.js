/**
 * Geometry 类只作为一个基类，用于整合底层的数据，包括顶点、法线、纹理坐标等。
 * 具体的几何体类（如 BoxGeometry、SphereGeometry 等）将继承自该类，并实现各自的顶点数据生成逻辑。
 *
 * @class Geometry
 */
import { flattenIf2D, toFloat32 } from './utils.js';
import Check from "./Check";
export default class Geometry {
    vertices = []; // 顶点位置
    normals = []; // 法线
    uvs = []; // 纹理坐标
    indices = [];// 索引
    colors = []; // 每个顶点的颜色
    positions = []; // 综合顶点数据(位置坐标、法线、纹理坐标、颜色等)
    constructor(options = {}) {
        const { vertices = [], normals = [], uvs = [], indices = [], colors = [] } = options;

        if (!vertices || vertices.length === 0) {
            throw new Error("Geometry: 'vertices' array is required and cannot be empty.");
        }
        this.vertices = this.initVertices(vertices);
        this.normals = this.initNormals(normals);
        this.uvs = uvs;
        this.indices = indices;
        this.colors = colors;
    }

    /**
     * 初始化顶点数据
     * @param positions
     */
    initVertices(positions) {
        let vertexArray = null;

        if (Array.isArray(positions)) {
            if (Check.isOneDimensionalArray(positions)) {
                vertexArray = toFloat32(positions);
            } else if (Check.isTwoDimensionalArray(positions)) {
                const flattened = flattenIf2D(positions);
                vertexArray = toFloat32(flattened);
            } else {
                console.error("Geometry: 'vertices' array must be 1D or 2D.");
            }
        } else if (positions instanceof Float32Array) {
            vertexArray = positions;
        } else if (positions instanceof Float64Array) {
            vertexArray = new Float32Array(positions);
        } else {
            console.error("Geometry: 'vertices' must be an Array, Float32Array, or Float64Array.");
        }
        return vertexArray;
    }

    /**
     * 初始化法线数据
     * @param normals
     */
    initNormals(normals) {

        if (normals && Array.isArray(normals) && normals.length > 0) {
            return  new Float32Array(normals);
        }

        if (!this.vertices || this.vertices.length === 0) {
            return null;
        }

        // 如果没有提供法线数据，则计算法线
        const v = this.vertices;          // 一定是 Float32Array
        const numVerts = v.length;
        if (numVerts % 9 !== 0) {
            console.warn('Geometry: vertices length is not a multiple of 9 (3 verts * 3 components).');
        }

        const n = new Float32Array(numVerts); // 自动初始化为 0

        // 3. 逐三角形计算面法线
        for (let i = 0; i < numVerts; i += 9) {
            const i0 = i;
            const i1 = i + 3;
            const i2 = i + 6;

            // 向量 p1 - p0
            const ax = v[i1]     - v[i0];
            const ay = v[i1 + 1] - v[i0 + 1];
            const az = v[i1 + 2] - v[i0 + 2];

            // 向量 p2 - p0
            const bx = v[i2]     - v[i0];
            const by = v[i2 + 1] - v[i0 + 1];
            const bz = v[i2 + 2] - v[i0 + 2];

            // 叉乘  a × b
            let nx = ay * bz - az * by;
            let ny = az * bx - ax * bz;
            let nz = ax * by - ay * bx;

            // 归一化
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            nx /= len;
            ny /= len;
            nz /= len;

            // 把同一法线写进 3 个顶点
            n[i0]     = nx; n[i0 + 1] = ny; n[i0 + 2] = nz;
            n[i1]     = nx; n[i1 + 1] = ny; n[i1 + 2] = nz;
            n[i2]     = nx; n[i2 + 1] = ny; n[i2 + 2] = nz;
        }

        return n;
    }
}