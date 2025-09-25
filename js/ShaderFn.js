import Shader from "./Shader.js";

// 注册一个加法器 (支持 float / vec2 / vec3 / vec4 重载)
Shader.RegisterShaderFn('vertex', 'add', `
    // 基础加法工具函数集合
    float add(float a, float b) { return a + b; }
    vec2 add(vec2 a, vec2 b) { return a + b; }
    vec3 add(vec3 a, vec3 b) { return a + b; }
    vec4 add(vec4 a, vec4 b) { return a + b; }
`)
