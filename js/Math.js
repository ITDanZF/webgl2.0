/**
 * 构建二维旋转矩阵
 * @param {*} angle 
 * @returns 
 */
export const RotateMatrix2D = (angle) => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    cos, -sin, 0,
    sin, cos, 0,
    0, 0, 1
  ];
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
  return [
    cos, -sin, 0, 0,
    sin, cos, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
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
  return [
    cos, 0, sin, 0,
    0, 1, 0, 0,
    -sin, 0, cos, 0,
    0, 0, 0, 1
  ];
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
  return [
    1, 0, 0, 0,
    0, cos, -sin, 0,
    0, sin, cos, 0,
    0, 0, 0, 1
  ];
};


function mat4ModelTRS(t = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  const [tx, ty, tz] = t;
  const [rx, ry, rz] = r;
  const [sx, sy, sz] = s;

  const cX = Math.cos(rx), sX = Math.sin(rx);
  const cY = Math.cos(ry), sY = Math.sin(ry);
  const cZ = Math.cos(rz), sZ = Math.sin(rz);

  // R = Rz * Ry * Rx（与你文件中 Rx/Ry/Rz 的定义一致）
  const r11 = cZ * cY;
  const r12 = -sZ * cX + cZ * sY * sX;
  const r13 =  sZ * sX + cZ * sY * cX;

  const r21 = sZ * cY;
  const r22 =  cZ * cX + sZ * sY * sX;
  const r23 = -cZ * sX + sZ * sY * cX;

  const r31 = -sY;
  const r32 =  cY * sX;
  const r33 =  cY * cX;

  // M = T * (R * S) ：右乘 S 等价于按列缩放
  const m = new Float32Array(16);
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
  m[8]  = r13 * sz;
  m[9]  = r23 * sz;
  m[10] = r33 * sz;
  m[11] = 0;
  // 第 4 列（平移）
  m[12] = tx;
  m[13] = ty;
  m[14] = tz;
  m[15] = 1;

  return m;
}



