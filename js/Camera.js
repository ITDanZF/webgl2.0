export default class Camera {
    constructor(CanvasWith, CanvasHeight) {
        // 相机在世界坐标系中的位置
        this.EyePosition = [0, 0, 0];
        // 相机看向的目标点
        this.TargetObject = [0, 0, 0];
        // 相机的上方向
        this._UpVector = [0, 1, 0];
        this._FOVY = this._rad(45);
        this._ASPECT = CanvasWith / CanvasHeight;
        this._NEAR = 0.1; // 近裁剪面
        this._FAR = 100; // 远裁剪面

        // 持久化矩阵，避免覆盖方法名
        this._ViewMatrix = new Float32Array(16);
        this._ProjectionMatrix = new Float32Array(16);
        this._ViewProjectionMatrix = new Float32Array(16);

        this._updateProjectionMatrix();
        this._updateViewMatrix();

        // this._MVMatrix = new Float32Array(16);
    }

    get ProjectionMatrix() {
        return this._ProjectionMatrix;
    }

    get ViewMatrix() {
        return this._ViewMatrix;
    }

    /**
     *  获取模视矩阵
     * @returns
     */
    getViewProjectionMatrix() {
        // 返回 P * V（列主序）
        // 假设调用前 view / projection 已被更新（位置 / 目标 / 投影参数变更时已调用更新函数）
        const P = this._ProjectionMatrix;
        const V = this._ViewMatrix;
        const out = this._ViewProjectionMatrix;

        // 硬编码矩阵乘法：out = P * V
        out[0] = P[0] * V[0] + P[4] * V[1] + P[8] * V[2] + P[12] * V[3];
        out[1] = P[1] * V[0] + P[5] * V[1] + P[9] * V[2] + P[13] * V[3];
        out[2] = P[2] * V[0] + P[6] * V[1] + P[10] * V[2] + P[14] * V[3];
        out[3] = P[3] * V[0] + P[7] * V[1] + P[11] * V[2] + P[15] * V[3];

        out[4] = P[0] * V[4] + P[4] * V[5] + P[8] * V[6] + P[12] * V[7];
        out[5] = P[1] * V[4] + P[5] * V[5] + P[9] * V[6] + P[13] * V[7];
        out[6] = P[2] * V[4] + P[6] * V[5] + P[10] * V[6] + P[14] * V[7];
        out[7] = P[3] * V[4] + P[7] * V[5] + P[11] * V[6] + P[15] * V[7];

        out[8] = P[0] * V[8] + P[4] * V[9] + P[8] * V[10] + P[12] * V[11];
        out[9] = P[1] * V[8] + P[5] * V[9] + P[9] * V[10] + P[13] * V[11];
        out[10] = P[2] * V[8] + P[6] * V[9] + P[10] * V[10] + P[14] * V[11];
        out[11] = P[3] * V[8] + P[7] * V[9] + P[11] * V[10] + P[15] * V[11];

        out[12] = P[0] * V[12] + P[4] * V[13] + P[8] * V[14] + P[12] * V[15];
        out[13] = P[1] * V[12] + P[5] * V[13] + P[9] * V[14] + P[13] * V[15];
        out[14] = P[2] * V[12] + P[6] * V[13] + P[10] * V[14] + P[14] * V[15];
        out[15] = P[3] * V[12] + P[7] * V[13] + P[11] * V[14] + P[15] * V[15];
        return out;
    }

    /**
     * 透视投影矩阵
     * @returns
     */
    _updateProjectionMatrix() {
        const fovy = this._FOVY;
        const aspect = this._ASPECT;
        const near = this._NEAR;
        const far = this._FAR;

        const f = 1 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
        const m = this._ProjectionMatrix;
        m[0] = f / aspect;
        m[5] = f;
        m[10] = (far + near) * nf;
        m[11] = -1;
        m[14] = 2 * far * near * nf;
        return m;
    }

    /**
     * 视图矩阵
     * @returns
     */
    _updateViewMatrix() {
        const [ex, ey, ez] = this.EyePosition;
        const [cx, cy, cz] = this.TargetObject;
        const [ux, uy, uz] = this._UpVector;

        // z 轴：相机前向的反方向（右手系）
        let zx = ex - cx,
            zy = ey - cy,
            zz = ez - cz;
        let len = Math.hypot(zx, zy, zz);
        zx /= len;
        zy /= len;
        zz /= len;

        // x 轴：right = normalize(cross(up, z))
        let xx = uy * zz - uz * zy;
        let xy = uz * zx - ux * zz;
        let xz = ux * zy - uy * zx;
        len = Math.hypot(xx, xy, xz);
        xx /= len;
        xy /= len;
        xz /= len;

        // y 轴：up' = cross(z, x)
        const yx = zy * xz - zz * xy;
        const yy = zz * xx - zx * xz;
        const yz = zx * xy - zy * xx;

        // 列主序填充
        const out = this._ViewMatrix;
        // 第1列：right
        out[0] = xx;
        out[1] = yx;
        out[2] = zx;
        out[3] = 0;
        // 第2列：up'
        out[4] = xy;
        out[5] = yy;
        out[6] = zy;
        out[7] = 0;
        // 第3列：forward(相机看向的反方向)
        out[8] = xz;
        out[9] = yz;
        out[10] = zz;
        out[11] = 0;
        // 第4列：平移
        out[12] = -(xx * ex + xy * ey + xz * ez);
        out[13] = -(yx * ex + yy * ey + yz * ez);
        out[14] = -(zx * ex + zy * ey + zz * ez);
        out[15] = 1;
        return out;
    }

    /**
     * 设置相机目标位置
     * @param {*} x
     * @param {*} y
     * @param {*} z
     */
    setTarget(x, y, z) {
        this.TargetObject = [x, y, z];
        this._updateViewMatrix();
    }

    /**
     * 设置相机位置
     * @param {*} x
     * @param {*} y
     * @param {*} z
     */
    setPosition(x, y, z) {
        this.EyePosition = [x, y, z];
        this._updateViewMatrix();
    }

    /**
     * 角度转弧度
     * @param {*} d
     * @returns
     */
    _rad(d) {
        return (d * Math.PI) / 180;
    }

    /**
     * 设置近裁剪面
     * @param {*} near
     */
    setNear(near) {
        this._NEAR = near;
        this._updateProjectionMatrix();
    }

    /**
     * 设置远裁剪面
     * @param {*} far
     */
    setFar(far) {
        this._FAR = far;
        this._updateProjectionMatrix();
    }

    /**
     * 设置垂直视野
     * @param {*} fovy
     */
    setFOVY(fovy) {
        this._FOVY = this._rad(fovy);
        this._updateProjectionMatrix();
    }

    // 新增便捷访问接口
    getViewMatrix() {
        return this._ViewMatrix;
    }
    getProjectionMatrix() {
        return this._ProjectionMatrix;
    }
}
