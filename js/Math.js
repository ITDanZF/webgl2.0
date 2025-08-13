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


