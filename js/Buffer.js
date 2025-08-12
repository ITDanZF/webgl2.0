export default class Buffer {
  constructor(webgl, DataArray, type = Float32Array) {
    this.gl = webgl;
    this.BufferId = webgl.createBuffer();
    this.AttributeConfig = [{
      location: 0,
      size: 0,
      type: this.gl.FLOAT,
      normalized: false,
      stride: 0,
      offset: 0
    }];

    let processedData;
    if (Array.isArray(DataArray) && DataArray.length > 0 && Array.isArray(DataArray[0])) {
      processedData = DataArray.flat();
    } else {
      processedData = DataArray;
    }

    // 根据 type 参数转换数据类型
    if (processedData instanceof type) {
      // 已经是正确的类型
      this.DataArray = processedData;
    } else {
      // 转换为指定的类型
      this.DataArray = new type(processedData);
    }

  }

  setPointConfig (ConfigArray) {
    this.AttributeConfig = []
    this.AttributeConfig = ConfigArray
    return this;
  }

  BindBuffer (type, usage = this.gl.STATIC_DRAW) {
    this.gl.bindBuffer(type, this.BufferId);
    this.gl.bufferData(type, this.DataArray, usage);

    if (type === this.gl.ARRAY_BUFFER) {
      if (this.AttributeConfig.length === 0 || this.AttributeConfig[0].size === 0) {
        console.warn("请设置顶点内存布局");
      }
      for (let i = 0; i < this.AttributeConfig.length; i++) {
        const config = this.AttributeConfig[i];
        // 设置顶点属性指针
        this.gl.vertexAttribPointer(
          config.location,           // 属性位置
          config.size,              // 组件数量 (1, 2, 3, 4)
          config.type,              // 数据类型
          config.normalized,        // 是否归一化
          config.stride,            // 步长
          config.offset             // 偏移量
        );

        // 启用顶点属性数组
        this.gl.enableVertexAttribArray(config.location);
      }
    }

    return this.BufferId;
  }



}