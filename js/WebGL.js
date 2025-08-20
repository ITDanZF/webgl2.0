export default class WebGL {
  constructor(id) {
    const style = document.createElement('style');
    style.id = '__base_reset__';
    style.textContent = `
        * { margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; }
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          background: #000; /* 可选：让背景也黑色 */
          overflow: hidden;
        }
      `;
    document.head.appendChild(style);

    const canvas = document.createElement('canvas');
    canvas.id = id;
    document.body.appendChild(canvas);

    this.canvas = canvas;
    this.webgl = canvas.getContext('webgl2');

    canvas.style.backgroundColor = 'black';
    canvas.style.display = 'block';
    const size = Math.min(window.innerWidth, window.innerHeight);
    canvas.width = size;
    canvas.height = size;

    this.webgl.viewport(0, 0, canvas.width, canvas.height);
  }

  /**
   * 设置 canvas 的 CSS 样式。
   * 传入样式对象；对常见长度属性的数值会自动追加 px。
   * @param {Record<string, string | number>} styles
   */
  setCanvasCSS (styles) {
    if (!styles || typeof styles !== 'object') return;
    const pixelProps = new Set([
      'width', 'height',
      'top', 'left', 'right', 'bottom',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'fontSize', 'lineHeight', 'letterSpacing'
    ]);
    for (const key in styles) {
      if (!Object.prototype.hasOwnProperty.call(styles, key)) continue;
      let value = styles[key];
      if (typeof value === 'number' && pixelProps.has(key)) {
        value = `${value}px`;
      }
      this.canvas.style[key] = value;
    }
  }

  setCanvasSize (width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setCanvasBackGroundColor (color) {
    this.canvas.style.backgroundColor = color;
  }

  setBodyBackgroundColor (color) {
    document.body.style.backgroundColor = color;
  }

  get gl () {
    return this.webgl;
  }

  get canvasElement () {
    return this.canvas;
  }

  /**
   * 创建着色器对象
   * @param {number} type
   * @param {string} source
   * @returns {WebGLShader | null}
   */
  createShader (type, source) {
    if (!this.gl) {
      console.error('gl上下文为空');
      return null;
    }
    const shader = this.gl.createShader(type); // 创建着色器对象
    this.gl.shaderSource(shader, source); // 设置着色器源代码
    this.gl.compileShader(shader); // 编译着色器

    const success = this.gl.getShaderParameter(
      shader,
      this.gl.COMPILE_STATUS
    );
    if (!success) {
      console.error('着色器编译失败:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  /**
   * 创建，链接着色器程序
   * @param {*} vertexShader // 编译好的着色器对象
   * @param {*} fragmentShader  // 编译好的着色器对象
   * @returns
   */
  createProgram (vertexShader, fragmentShader) {
    if (!this.gl) {
      console.error('gl上下文为空');
      return null;
    }
    const program = this.gl.createProgram(); // 创建程序对象
    this.gl.attachShader(program, vertexShader); // 附加顶点着色器
    this.gl.attachShader(program, fragmentShader); // 附加片段着色器
    this.gl.linkProgram(program); // 链接程序

    const success = this.gl.getProgramParameter(
      program,
      this.gl.LINK_STATUS
    );
    if (!success) {
      console.error('程序链接失败:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  /**
   * 使用着色器程序
   * @param {*} vertexShader
   * @param {*} fragmentShader
   * @returns
   */
  useProgram (vertexShader, fragmentShader) {
    if (!this.gl) {
      console.error('gl上下文为空');
      return;
    }
    const vertex = this.createShader(this.gl.VERTEX_SHADER, vertexShader);
    const fragment = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragmentShader
    );
    const program = this.createProgram(vertex, fragment);
    this.gl.useProgram(program);
    return program;
  }


  BufferData () {

  }

  /**
   * 创建并绑定某种类型的缓冲区对象
   * @param {*} type
   * @returns
   */
  Bind (type) {
    if (!this.gl) {
      console.error('gl上下文为空');
      return;
    }

    const BufferId = this.gl.createBuffer(); // 创建缓冲区对象
    this.gl.bindBuffer(type, BufferId); // 绑定缓冲区对象
    return BufferId;
  }

  /**
   * 解绑缓冲区对象，清除显存中的缓存数据
   * @param {*} type
   * @param {*} BufferId
   * @returns
   */
  UnBind (type, BufferId) {
    if (!this.gl) {
      console.error('gl上下文为空');
      return;
    }
    this.gl.bindBuffer(type, null);
    this.gl.deleteBuffer(BufferId);
  }

  /**
   * 设置uniform 二维向量
   * @param {*} program
   * @param {*} name
   * @param {*} v1
   * @param {*} v2
   * @returns
   */
  setUniform2f (program, name, v1, v2) {
    if (!this.gl) {
      console.error('gl上下文为空');
      return;
    }
    const location = this.gl.getUniformLocation(program, name);
    if (location === null) {
      console.error('找不到uniform变量:', name);
      return;
    }
    this.gl.uniform2f(location, v1, v2);
  }

  /**
   * 设置uniform 三维向量
   * @param {*} program
   * @param {*} name
   * @param {*} v1
   * @param {*} v2
   * @param {*} v3
   * @returns
   */
  setUniform3f (program, name, v1, v2, v3) {
    if (!this.gl) {
      console.error('gl上下文为空');
      return;
    }
    const location = this.gl.getUniformLocation(program, name);
    if (location === null) {
      console.error('找不到uniform变量:', name);
      return;
    }
    this.gl.uniform3f(location, v1, v2, v3);
  }

  /**
   * 设置uniform 四维向量
   * @param {*} program
   * @param {*} name
   * @param {*} v1
   * @param {*} v2
   * @param {*} v3
   * @param {*} v4
   * @returns
   */
  setUniform4f (program, name, v1, v2, v3, v4) {
    if (!this.gl) {
      console.error('gl上下文为空');
      return;
    }
    const location = this.gl.getUniformLocation(program, name);
    if (location === null) {
      console.error('找不到uniform变量:', name);
      return;
    }
    this.gl.uniform4f(location, v1, v2, v3, v4);
  }

  /**
   * 设置uniform 三维矩阵
   * @param {*} program
   * @param {*} name
   * @param {*} matrix
   * @returns
   */
  setUniformMatrix3 (program, name, matrix) {
    if (!this.gl) {
      console.error('gl上下文为空');
      return;
    }
    const location = this.gl.getUniformLocation(program, name);
    if (location === null) {
      console.error('找不到uniform变量:', name);
      return;
    }
    this.gl.uniformMatrix3fv(location, false, matrix);
  }

  /**
   * 设置uniform 四维矩阵（mat4）
   * @param {*} program
   * @param {string} name
   * @param {Float32Array|number[]} matrix // 16 个元素的列主序矩阵
   */
  setUniformMatrix4 (program, name, matrix) {
    if (!this.gl) {
      console.error('gl上下文为空');
      return;
    }
    const location = this.gl.getUniformLocation(program, name);
    if (location === null) {
      console.error('找不到uniform变量:', name);
      return;
    }
    // WebGL 按列主序，transpose 必须为 false
    this.gl.uniformMatrix4fv(location, false, matrix);
  }
}
