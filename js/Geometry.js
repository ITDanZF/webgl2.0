export default class Geometry {
    /**
     * 基础几何数据与 GPU 资源管理类
     * 仅负责顶点/索引/缓冲/包围体/法线等与形状相关的逻辑，不包含世界变换。
     */
    constructor(options = {}) {
        // attributes: Map<string, { data:TypedArray, size:number, type:number|null, normalized:boolean, stride:number, offset:number, usage:number|null, location:number|null }>
        this.attributes = new Map();
        // 索引数据 (Uint16Array | Uint32Array)
        this.index = null;

        // GPU 资源句柄
        this.buffers = {
            vao: null,
            vbos: new Map(), // name -> WebGLBuffer
            ebo: null
        };

        // 统计
        this.vertexCount = 0; // 非索引模式下顶点数量
        this.indexCount = 0;  // 索引数量（若存在 indices）

        // 绘制模式 (延迟到 build 时确定, 默认 gl.TRIANGLES)
        this.drawMode = options.drawMode || null;

        // 包围体
        this.boundingBox = null;    // { min:[x,y,z], max:[x,y,z] }
        this.boundingSphere = null; // { center:[x,y,z], radius }
        this._boundsDirty = true;

        // 状态标记
        this._structureDirty = true;      // 布局/属性新增删除
        this._dataDirty = new Set();      // 某些 attribute 只更新数据
        this._built = false;              // 是否已上传

        // 自动分配 attribute location 时的游标
        this._nextAutoLocation = 0;

        // 可选：初始化时直接注入 attributes / index
        if (options.attributes) {
            for (const [name, desc] of Object.entries(options.attributes)) {
                // desc: { data, size, ... }
                this.setAttribute(name, desc.data, desc.size, desc);
            }
        }
        if (options.index) this.setIndex(options.index);
    }

    /* ------------------------------- Attribute API ------------------------------- */
    /**
     * 新增或替换一个 attribute
     * @param {string} name
     * @param {TypedArray} data
     * @param {number} size 组件个数(1~4)
     * @param {object} options 可选: { type, normalized, stride, offset, usage, location }
     */
    setAttribute(name, data, size, options = {}) {
        if (!data || typeof data.length !== 'number') {
            throw new Error(`setAttribute('${name}') 需要 TypedArray`);
        }
        if (size <= 0 || size > 4) {
            throw new Error(`Attribute '${name}' 的 size 必须在 1~4 之间`);
        }
        const attr = {
            data,
            size,
            type: options.type || null, // 构建时若为 null 则使用 gl.FLOAT 推断
            normalized: !!options.normalized,
            stride: options.stride || 0,
            offset: options.offset || 0,
            usage: options.usage || null, // 构建时若为 null 默认 gl.STATIC_DRAW
            location: options.location ?? null // 若未传入则自动分配
        };
        this.attributes.set(name, attr);
        this._structureDirty = true;
        if (name === 'position') this._boundsDirty = true;
        // 顶点数量依据第一个 attribute 推断
        if (name === 'position' || this.vertexCount === 0) {
            this.vertexCount = data.length / size;
        }
        return this;
    }

    /**
     * 更新已存在 attribute 的数据（长度必须一致，否则建议重新 setAttribute）
     */
    updateAttribute(name, newData) {
        const attr = this.attributes.get(name);
        if (!attr) throw new Error(`updateAttribute: attribute '${name}' 不存在`);
        if (newData.length !== attr.data.length) {
            throw new Error(`updateAttribute('${name}') 新旧数据长度不一致，若需更改长度请使用 setAttribute`);
        }
        attr.data = newData;
        this._dataDirty.add(name);
        if (name === 'position') this._boundsDirty = true;
        return this;
    }

    hasAttribute(name) { return this.attributes.has(name); }

    removeAttribute(name) {
        if (this.attributes.delete(name)) {
            this._structureDirty = true;
            if (name === 'position') {
                this.vertexCount = this._recalcVertexCount();
                this._boundsDirty = true;
            }
        }
    }

    _recalcVertexCount() {
        // 以第一个 attribute 重新推断
        for (const [_, a] of this.attributes) {
            return a.data.length / a.size;
        }
        return 0;
    }

    /* --------------------------------- Index API --------------------------------- */
    setIndex(data) {
        if (data && typeof data.length === 'number') {
            if (!(data instanceof Uint16Array || data instanceof Uint32Array)) {
                // 自动选择类型
                const max = this._maxArrayValue(data);
                if (max < 65536) data = new Uint16Array(data);
                else data = new Uint32Array(data);
            }
            this.index = data;
            this.indexCount = data.length;
            this._structureDirty = true;
        } else if (data == null) {
            this.clearIndex();
        } else {
            throw new Error('setIndex 需要 (Uint16|Uint32)Array 或可迭代对象');
        }
        return this;
    }

    clearIndex() {
        if (this.index) {
            this.index = null;
            this.indexCount = 0;
            this._structureDirty = true;
        }
    }

    /* ------------------------------- Build / Bind -------------------------------- */
    /**
     * 构建 VAO / VBO，将数据上传 GPU。
     * @param {WebGL2RenderingContext} gl
     * @param {Object} locations attributeName -> location （可选；优先级低于 setAttribute 时显式提供的 location）
     */
    build(gl, locations = {}) {
        if (!gl) throw new Error('build 需要 gl 上下文');
        if (this.attributes.size === 0) throw new Error('Geometry 没有任何 attribute');
        // 推断 drawMode
        if (this.drawMode == null) this.drawMode = gl.TRIANGLES;

        // 若已有旧 VAO，先释放（完整重建）
        if (this._structureDirty && this._built) {
            this._deleteGpu(gl);
        }

        // 创建 VAO
        if (!this.buffers.vao) {
            this.buffers.vao = gl.createVertexArray();
        }
        gl.bindVertexArray(this.buffers.vao);

        // 逐 attribute 创建 / 绑定
        for (const [name, attr] of this.attributes) {
            // 已存在且只数据更新 -> 忽略（后续处理 _dataDirty）
            if (!this._structureDirty && this.buffers.vbos.has(name)) continue;
            // 新建/重建 VBO
            const buffer = gl.createBuffer();
            this.buffers.vbos.set(name, buffer);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                attr.data,
                attr.usage || gl.STATIC_DRAW
            );
            // 解析 location
            if (attr.location == null) {
                if (name in locations) attr.location = locations[name];
                else attr.location = this._nextAutoLocation++;
            }
            const type = attr.type || gl.FLOAT;
            gl.enableVertexAttribArray(attr.location);
            gl.vertexAttribPointer(
                attr.location,
                attr.size,
                type,
                attr.normalized,
                attr.stride,
                attr.offset
            );
        }

        // 上传 index
        if (this.index) {
            if (!this.buffers.ebo || this._structureDirty) {
                if (this.buffers.ebo) gl.deleteBuffer(this.buffers.ebo);
                this.buffers.ebo = gl.createBuffer();
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.ebo);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                this.index,
                gl.STATIC_DRAW
            );
        }

        // 处理纯数据更新（不改变结构）
        if (!this._structureDirty && this._dataDirty.size) {
            for (const name of this._dataDirty) {
                const attr = this.attributes.get(name);
                const buffer = this.buffers.vbos.get(name);
                if (!attr || !buffer) continue;
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, attr.data);
            }
        }

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this._dataDirty.clear();
        this._structureDirty = false;
        this._built = true;
        return this;
    }

    /** 绑定 VAO 以供绘制 */
    bind(gl) {
        if (!this._built || this._structureDirty || this._dataDirty.size) {
            this.build(gl); // 自动增量或重建
        }
        gl.bindVertexArray(this.buffers.vao);
    }

    /** 解绑 */
    unbind(gl) {
        gl.bindVertexArray(null);
    }

    /** 释放 GPU 资源 */
    dispose(gl) {
        this._deleteGpu(gl);
        this.attributes.clear();
        this.index = null;
        this.vertexCount = 0;
        this.indexCount = 0;
        this.boundingBox = null;
        this.boundingSphere = null;
        this._built = false;
    }

    _deleteGpu(gl) {
        if (!gl) return;
        if (this.buffers.vao) {
            gl.deleteVertexArray(this.buffers.vao);
            this.buffers.vao = null;
        }
        if (this.buffers.ebo) {
            gl.deleteBuffer(this.buffers.ebo);
            this.buffers.ebo = null;
        }
        for (const [, buf] of this.buffers.vbos) {
            gl.deleteBuffer(buf);
        }
        this.buffers.vbos.clear();
    }

    /* ------------------------------- Bounds / Normals ---------------------------- */
    /** 计算/获取包围盒 */
    getBoundingBox() {
        if (this._boundsDirty || !this.boundingBox) this.computeBoundingBox();
        return this.boundingBox;
    }

    /** 计算/获取包围球 */
    getBoundingSphere() {
        if (this._boundsDirty || !this.boundingSphere) this.computeBoundingSphere();
        return this.boundingSphere;
    }

    computeBoundingBox() {
        const posAttr = this.attributes.get('position');
        if (!posAttr) throw new Error('computeBoundingBox 需要 position attribute');
        const a = posAttr.data;
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < a.length; i += posAttr.size) {
            const x = a[i];
            const y = a[i + 1];
            const z = posAttr.size > 2 ? a[i + 2] : 0;
            if (x < min[0]) min[0] = x;
            if (y < min[1]) min[1] = y;
            if (z < min[2]) min[2] = z;
            if (x > max[0]) max[0] = x;
            if (y > max[1]) max[1] = y;
            if (z > max[2]) max[2] = z;
        }
        this.boundingBox = { min, max };
        this._boundsDirty = false;
        return this.boundingBox;
    }

    computeBoundingSphere() {
        const box = this.getBoundingBox();
        const center = [
            (box.min[0] + box.max[0]) / 2,
            (box.min[1] + box.max[1]) / 2,
            (box.min[2] + box.max[2]) / 2
        ];
        const posAttr = this.attributes.get('position');
        const a = posAttr.data;
        let maxDistSq = 0;
        for (let i = 0; i < a.length; i += posAttr.size) {
            const x = a[i] - center[0];
            const y = a[i + 1] - center[1];
            const z = (posAttr.size > 2 ? a[i + 2] : 0) - center[2];
            const d = x * x + y * y + z * z;
            if (d > maxDistSq) maxDistSq = d;
        }
        this.boundingSphere = { center, radius: Math.sqrt(maxDistSq) };
        return this.boundingSphere;
    }

    /** 生成顶点法线（若已存在 normal 则跳过） */
    computeNormals(force = false) {
        if (this.hasAttribute('normal') && !force) return this.attributes.get('normal').data;
        const posAttr = this.attributes.get('position');
        if (!posAttr) throw new Error('computeNormals 需要 position');
        const vSize = posAttr.size; // 支持 vec2 -> 自动补 0
        const vertCount = posAttr.data.length / vSize;
        const normals = new Float32Array(vertCount * 3);

        const addFaceNormal = (ia, ib, ic) => {
            const ax = posAttr.data[ia * vSize];
            const ay = posAttr.data[ia * vSize + 1];
            const az = vSize > 2 ? posAttr.data[ia * vSize + 2] : 0;
            const bx = posAttr.data[ib * vSize];
            const by = posAttr.data[ib * vSize + 1];
            const bz = vSize > 2 ? posAttr.data[ib * vSize + 2] : 0;
            const cx = posAttr.data[ic * vSize];
            const cy = posAttr.data[ic * vSize + 1];
            const cz = vSize > 2 ? posAttr.data[ic * vSize + 2] : 0;
            // (b-a) x (c-a)
            const abx = bx - ax, aby = by - ay, abz = bz - az;
            const acx = cx - ax, acy = cy - ay, acz = cz - az;
            const nx = aby * acz - abz * acy;
            const ny = abz * acx - abx * acz;
            const nz = abx * acy - aby * acx;
            normals[ia * 3] += nx; normals[ia * 3 + 1] += ny; normals[ia * 3 + 2] += nz;
            normals[ib * 3] += nx; normals[ib * 3 + 1] += ny; normals[ib * 3 + 2] += nz;
            normals[ic * 3] += nx; normals[ic * 3 + 1] += ny; normals[ic * 3 + 2] += nz;
        };

        if (this.index) {
            for (let i = 0; i < this.index.length; i += 3) {
                addFaceNormal(this.index[i], this.index[i + 1], this.index[i + 2]);
            }
        } else {
            for (let i = 0; i < vertCount; i += 3) {
                addFaceNormal(i, i + 1, i + 2);
            }
        }

        // 归一化
        for (let i = 0; i < normals.length; i += 3) {
            const x = normals[i];
            const y = normals[i + 1];
            const z = normals[i + 2];
            const len = Math.hypot(x, y, z) || 1;
            normals[i] = x / len;
            normals[i + 1] = y / len;
            normals[i + 2] = z / len;
        }

        this.setAttribute('normal', normals, 3); // 会标记 structureDirty
        this._structureDirty = true; // 重新上传
        return normals;
    }

    /* --------------------------------- Utilities --------------------------------- */
    _maxArrayValue(arr) {
        let m = -Infinity; for (let i = 0; i < arr.length; i++) if (arr[i] > m) m = arr[i]; return m;
    }

    /** 返回绘制需要的信息 */
    getDrawInfo() {
        return {
            mode: this.drawMode,
            count: this.index ? this.indexCount : this.vertexCount,
            indexed: !!this.index,
            type: this.index ? (this.index instanceof Uint32Array ? 'UNSIGNED_INT' : 'UNSIGNED_SHORT') : null
        };
    }
}