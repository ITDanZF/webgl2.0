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
