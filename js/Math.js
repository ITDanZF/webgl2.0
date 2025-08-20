/**
 * 构建二维旋转矩阵
 * @param {*} angle
 * @returns
 */
export const RotateMatrix2D = (angle) => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [cos, -sin, 0, sin, cos, 0, 0, 0, 1];
};

/**
 * 绕z轴旋转的三维矩阵
 * @param {*} angle
 * @returns
 */
export const RotateMatrix3DZ = (angle) => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};

/**
 * 绕y轴旋转的三维矩阵
 * @param {*} angle
 * @returns
 */
export const RotateMatrix3DY = (angle) => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1];
};

/**
 * 绕x轴旋转的三维矩阵
 * @param {*} angle
 * @returns
 */
export const RotateMatrix3DX = (angle) => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1];
};

/**
 * 4x4 矩阵相乘 (列主序)  result = a * b
 * 传入与返回都为长度 16 的数组/Float32Array，索引按照列主序：
 * | m0  m4  m8  m12 |
 * | m1  m5  m9  m13 |
 * | m2  m6  m10 m14 |
 * | m3  m7  m11 m15 |
 * @param {number[]|Float32Array} a 左矩阵
 * @param {number[]|Float32Array} b 右矩阵
 * @param {Float32Array|number[]} [out] 可选输出缓冲，默认新建 Float32Array(16)
 * @returns {Float32Array|number[]} out
 */
export const mulMat4 = (a, b, out = new Float32Array(16)) => {
  // 若输出与输入相同，先复制到临时数组避免被覆盖
  let ta = a,
    tb = b;
  if (out === a) ta = new Float32Array(a); // 复制 a
  if (out === b) tb = out === a ? new Float32Array(b) : new Float32Array(b);

  const a0 = ta[0],
    a1 = ta[1],
    a2 = ta[2],
    a3 = ta[3];
  const a4 = ta[4],
    a5 = ta[5],
    a6 = ta[6],
    a7 = ta[7];
  const a8 = ta[8],
    a9 = ta[9],
    a10 = ta[10],
    a11 = ta[11];
  const a12 = ta[12],
    a13 = ta[13],
    a14 = ta[14],
    a15 = ta[15];

  const b0 = tb[0],
    b1 = tb[1],
    b2 = tb[2],
    b3 = tb[3];
  const b4 = tb[4],
    b5 = tb[5],
    b6 = tb[6],
    b7 = tb[7];
  const b8 = tb[8],
    b9 = tb[9],
    b10 = tb[10],
    b11 = tb[11];
  const b12 = tb[12],
    b13 = tb[13],
    b14 = tb[14],
    b15 = tb[15];

  // 第一列 (col 0)
  out[0] = a0 * b0 + a4 * b1 + a8 * b2 + a12 * b3;
  out[1] = a1 * b0 + a5 * b1 + a9 * b2 + a13 * b3;
  out[2] = a2 * b0 + a6 * b1 + a10 * b2 + a14 * b3;
  out[3] = a3 * b0 + a7 * b1 + a11 * b2 + a15 * b3;
  // 第二列 (col 1)
  out[4] = a0 * b4 + a4 * b5 + a8 * b6 + a12 * b7;
  out[5] = a1 * b4 + a5 * b5 + a9 * b6 + a13 * b7;
  out[6] = a2 * b4 + a6 * b5 + a10 * b6 + a14 * b7;
  out[7] = a3 * b4 + a7 * b5 + a11 * b6 + a15 * b7;
  // 第三列 (col 2)
  out[8] = a0 * b8 + a4 * b9 + a8 * b10 + a12 * b11;
  out[9] = a1 * b8 + a5 * b9 + a9 * b10 + a13 * b11;
  out[10] = a2 * b8 + a6 * b9 + a10 * b10 + a14 * b11;
  out[11] = a3 * b8 + a7 * b9 + a11 * b10 + a15 * b11;
  // 第四列 (col 3)
  out[12] = a0 * b12 + a4 * b13 + a8 * b14 + a12 * b15;
  out[13] = a1 * b12 + a5 * b13 + a9 * b14 + a13 * b15;
  out[14] = a2 * b12 + a6 * b13 + a10 * b14 + a14 * b15;
  out[15] = a3 * b12 + a7 * b13 + a11 * b14 + a15 * b15;

  return out;
};

/**
 * 生成正交投影矩阵
 * @param {*} l 
 * @param {*} r 
 * @param {*} b 
 * @param {*} t 
 * @param {*} n 
 * @param {*} f 
 * @returns 
 */
export function MorthoMatrix (l, r, b, t, n, f) {
  return new Float32Array(
    [
      [2 / (r - l), 0, 0, 0],
      [0, 2 / (t - b), 0, 0],
      [0, 0, -1, 0],
      [-(r + l) / (r - l), -(t + b) / (t - b), 0, 1],
    ].flat()
  );
}