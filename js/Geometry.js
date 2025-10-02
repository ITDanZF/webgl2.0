/**
 * Geometry 类只作为一个基类，用于整合底层的数据，包括顶点、法线、纹理坐标等。
 * 具体的几何体类（如 BoxGeometry、SphereGeometry 等）将继承自该类，并实现各自的顶点数据生成逻辑。
 *
 * @class Geometry
 */
import { flattenIf2D, toFloat32 } from './utils.js';
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
        this.vertices = vertices;
        this.normals = normals;
        this.uvs = uvs;
        this.indices = indices;
        this.colors = colors;
    }

    /**
     * 1.完成vertices的初始化
     * vertices接收普通一维度数组也接收Float32 以及 float64数组，也就是普通二维形式的数组
     * 2.初始化normals，uvs，indices
     * 如果上面有一个参数没有传递，则需要根据vertices进行初始化
     * 3.colors 没有传递则不进行初始化
     * 4.将初始化或者已经传递的值组合进positions中
     */
    initData() {

        // 1. 处理顶点数据
        this.vertices = flattenIf2D(this.vertices);
        this.vertices = toFloat32(this.vertices);
        if (this.vertices.length % 3 !== 0) {
            throw new Error(`Geometry: vertices length (${this.vertices.length}) must be multiple of 3.`);
        }
        const vertexCount = this.vertices.length / 3;

        // 2. 处理法线 (缺省 -> 全 0)
        if (!this.normals || this.normals.length === 0) {
            this.normals = new Float32Array(vertexCount * 3); // 全 0
        } else {
            this.normals = flattenIf2D(this.normals);
            this.normals = toFloat32(this.normals);
            if (this.normals.length !== vertexCount * 3) {
                throw new Error(`Geometry: normals length (${this.normals.length}) must be vertexCount * 3 (${vertexCount * 3}).`);
            }
        }

        // 3. 处理 UV (缺省 -> 全 0)
        if (!this.uvs || this.uvs.length === 0) {
            this.uvs = new Float32Array(vertexCount * 2); // 全 0
        } else {
            this.uvs = flattenIf2D(this.uvs);
            this.uvs = toFloat32(this.uvs);
            if (this.uvs.length !== vertexCount * 2) {
                throw new Error(`Geometry: uvs length (${this.uvs.length}) must be vertexCount * 2 (${vertexCount * 2}).`);
            }
        }

        // 4. 处理索引 (缺省 -> 顺序索引)
        if (!this.indices || this.indices.length === 0) {
            // 如果顶点数小于 65536 使用 Uint16Array, 否则使用 Uint32Array (需 WebGL2 支持)
            const IndexArrayType = vertexCount < 65536 ? Uint16Array : Uint32Array;
            this.indices = new IndexArrayType(vertexCount);
            for (let i = 0; i < vertexCount; i++) this.indices[i] = i;
        } else {
            // 如果是普通数组，尽量压缩类型
            if (!(this.indices instanceof Uint16Array) && !(this.indices instanceof Uint32Array)) {
                const maxIndex = Math.max(...this.indices);
                const IndexArrayType = maxIndex < 65536 ? Uint16Array : Uint32Array;
                this.indices = new IndexArrayType(this.indices);
            }
        }

        // 5. 处理颜色 (可选) 允许 3 或 4 通道
        let colorSize = 0; // 每个顶点的颜色分量数 (0 表示未提供)
        if (this.colors && this.colors.length > 0) {
            this.colors = flattenIf2D(this.colors);
            // 判断是 3 通道还是 4 通道
            const cLen = this.colors.length;
            if (cLen % vertexCount !== 0) {
                throw new Error(`Geometry: colors length (${cLen}) must be divisible by vertexCount (${vertexCount}).`);
            }
            colorSize = cLen / vertexCount;
            if (colorSize !== 3 && colorSize !== 4) {
                throw new Error(`Geometry: colors components per vertex must be 3 or 4, got ${colorSize}.`);
            }
            // 统一转换为 Float32
            this.colors = toFloat32(this.colors);
        }
        this._colorSize = colorSize; // 记录内部颜色分量数，后续可用于设置 attributePointer

        // 6. 组装 interleaved positions
        // Layout 顺序: position(3) | normal(3) | uv(2) | color(colorSize 可为 0/3/4)
        const stride = 3 + 3 + 2 + (colorSize || 0);
        const interleaved = new Float32Array(vertexCount * stride);

        for (let i = 0; i < vertexCount; i++) {
            let offset = i * stride;
            // position
            interleaved[offset++] = this.vertices[i * 3];
            interleaved[offset++] = this.vertices[i * 3 + 1];
            interleaved[offset++] = this.vertices[i * 3 + 2];
            // normal
            interleaved[offset++] = this.normals[i * 3];
            interleaved[offset++] = this.normals[i * 3 + 1];
            interleaved[offset++] = this.normals[i * 3 + 2];
            // uv
            interleaved[offset++] = this.uvs[i * 2];
            interleaved[offset++] = this.uvs[i * 2 + 1];
            // colors (如有)
            if (colorSize) {
                interleaved[offset++] = this.colors[i * colorSize];
                interleaved[offset++] = this.colors[i * colorSize + 1];
                interleaved[offset++] = this.colors[i * colorSize + 2];
                if (colorSize === 4) {
                    interleaved[offset++] = this.colors[i * colorSize + 3];
                }
            }
        }

        this.positions = interleaved;
        this.strideInfo = {
            vertexCount,
            colorSize,
            stride,                 // 每个顶点总分量数 (float 个数)
            byteStride: stride * 4,  // 每个顶点的字节大小
            layout: {
                position: { size: 3, offset: 0 },
                normal: { size: 3, offset: 3 },
                uv: { size: 2, offset: 6 },
                color: colorSize ? { size: colorSize, offset: 8 } : null
            }
        };

        return this; // 支持链式调用
    }
}