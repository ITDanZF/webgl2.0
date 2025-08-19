export default class Object3D {
    constructor() {
        this.position = [0, 0, 0];
        // 内部以弧度存储 rotation
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];

        // 持久化矩阵，避免覆盖方法名
        this.modelMatrix = new Float32Array(16);
        this._dirty = true; // 标记是否需要重算矩阵

        // 初始化矩阵
        this.getModelMatrix();
    }

    /**
     * 设置旋转（接受角度数组 [x, y, z]），内部转为弧度
     * @param {number[]} value
     */
    setRotation(x, y, z) {
        this.rotation = [this.rad(x), this.rad(y), this.rad(z)];
        this._dirty = true;
    }

    /**
     * 设置 Z 轴旋转（度）
     * @param {number} value
     */
    setRotationZ(value) {
        this.rotation[2] = this.rad(value);
        this._dirty = true;
    }

    /**
     * 设置 Y 轴旋转（度）
     * @param {number} value
     */
    setRotationY(value) {
        this.rotation[1] = this.rad(value);
        this._dirty = true;
    }

    /**
     * 设置 X 轴旋转（度）
     * @param {number} value
     */
    setRotationX(value) {
        this.rotation[0] = this.rad(value);
        this._dirty = true;
    }

    /**
     * 同时设置三个轴的缩放。接受单个数或数组 [x,y,z]
     * @param {number|number[]} value
     */
    setScale(value) {
        if (Array.isArray(value)) {
            this.scale = value.slice(0, 3);
        } else {
            this.scale = [value, value, value];
        }
        this._dirty = true;
    }

    /** 沿着 Z 轴缩放 */
    setScaleZ(value) {
        this.scale[2] = value;
        this._dirty = true;
    }

    /** 沿着 Y 轴缩放 */
    setScaleY(value) {
        this.scale[1] = value;
        this._dirty = true;
    }

    /** 沿着 X 轴缩放 */
    setScaleX(value) {
        this.scale[0] = value;
        this._dirty = true;
    }

    /** 设置模型的位置，接受 [x,y,z] */
    setPosition(pos) {
        this.position = pos.slice(0, 3);
        this._dirty = true;
    }

    /** 设置 Z 轴位置 */
    setZ(Value) {
        this.position[2] = Value;
        this._dirty = true;
    }

    /** 设置 Y 轴位置 */
    setY(Value) {
        this.position[1] = Value;
        this._dirty = true;
    }

    /** 设置 X 轴位置 */
    setX(Value) {
        this.position[0] = Value;
        this._dirty = true;
    }

    /**
     * 弧度函数
     * @param {number} d
     * @returns {number}
     */
    rad(d) {
        return (d * Math.PI) / 180;
    }

    get ModelMatrix() {
        return this.getModelMatrix();
    }

    /**
     * 外部获取矩阵（惰性计算）
     */
    getModelMatrix() {
        if (this._dirty) {
            this._updateModelMatrix();
            this._dirty = false;
        }
        return this.modelMatrix;
    }

    /**
     * 矩阵计算实现（内部）
     */
    _updateModelMatrix() {
        const [tx, ty, tz] = this.position;
        const [rx, ry, rz] = this.rotation;
        const [sx, sy, sz] = this.scale;

        const cX = Math.cos(rx),
            sX = Math.sin(rx);
        const cY = Math.cos(ry),
            sY = Math.sin(ry);
        const cZ = Math.cos(rz),
            sZ = Math.sin(rz);

        // R = Rz * Ry * Rx
        const r11 = cZ * cY;
        const r12 = -sZ * cX + cZ * sY * sX;
        const r13 = sZ * sX + cZ * sY * cX;

        const r21 = sZ * cY;
        const r22 = cZ * cX + sZ * sY * sX;
        const r23 = -cZ * sX + sZ * sY * cX;

        const r31 = -sY;
        const r32 = cY * sX;
        const r33 = cY * cX;

        const m = this.modelMatrix;
        // 第 1 列（含 sx）
        m[0] = r11 * sx;
        m[1] = r21 * sx;
        m[2] = r31 * sx;
        m[3] = 0;
        // 第 2 列（含 sy）
        m[4] = r12 * sy;
        m[5] = r22 * sy;
        m[6] = r32 * sy;
        m[7] = 0;
        // 第 3 列（含 sz）
        m[8] = r13 * sz;
        m[9] = r23 * sz;
        m[10] = r33 * sz;
        m[11] = 0;
        // 第 4 列（平移）
        m[12] = tx;
        m[13] = ty;
        m[14] = tz;
        m[15] = 1;
    }
}
