export default class Shader {
    vertexSource = "";
    fragmentSource = ""

    // 片段函数库
    static vertexFns = []
    static fragmentFns = []
    vertexFnsArray = []
    fragmentFnsArray = []

    constructor(version) {
        this.vertexSource = "#version 300 es";
        this.fragmentSource = "#version 300 es";

        this.vertexFnsArray = [...Shader.vertexFns];
        this.fragmentFnsArray = [...Shader.fragmentFns];
    }

    /**
     * 注册顶点着色器主函数
     * @param fn
     */
    setVertexMain(fn) {
        // 1.fn是顶点着色器主函数，以及定义的相关变量
        // 2.遍历vertexFnsArray函数库，在fn中使用正则表达式检索@include 函数名
        // 将检索到的函数名在vertexFnsArray中查找对应的函数，并替换到fn中，并且去掉@include 函数名
        // 3.将处理后的fn赋值给this.vertexSource
        const includeRe = /^\s*@include\s+(\w+)\s*;\s*$/gm;
        const deps = new Set();
        let m;
        while ((m = includeRe.exec(fn))) deps.add(m[1]);

        // 2. 按注册顺序把依赖的函数体收集起来
        const fnBodies = [];
        for (const { name, fn: body } of this.vertexFnsArray) {
            if (deps.has(name)) {
                fnBodies.push(body);
                deps.delete(name);
            }
        }

        // 3. 如果有没找到的实现，直接报错
        if (deps.size) {
            throw new Error(`vertex shader 缺少函数定义: ${[...deps].join(', ')}`);
        }

        // 4. 去掉主函数里的 @include 行
        const cleaned = fn.replace(includeRe, '');

        // 5. 拼成最终源码
        this.vertexSource = [
            this.vertexSource,   // #version 300 es
            ...fnBodies,         // 依赖的函数体
            cleaned              // 主函数
        ].join('\n');
    }


    /**
     * 注册片段着色器主函数
     * @param fn
     */
    setFragmentMain(fn) {
        // 1. 提取所有 @include 函数名;
        const includeRe = /^\s*@include\s+(\w+)\s*;\s*$/gm;
        const deps = new Set();
        let m;
        while ((m = includeRe.exec(fn))) deps.add(m[1]);

        // 2. 把静态数组转成 Map，实现 O(1) 查找
        const fnMap = new Map(Shader.fragmentFns.map(({ name, fn: body }) => [name, body]));

        // 3. 按依赖顺序收集函数体（保持 deps 出现顺序）
        const fnBodies = [];
        for (const name of deps) {
            if (!fnMap.has(name)) {
                throw new Error(`fragment shader 缺少函数定义: ${name}`);
            }
            fnBodies.push(fnMap.get(name));
        }

        // 4. 去掉主函数里的 @include 行
        const cleaned = fn.replace(includeRe, '');

        // 5. 拼成最终源码
        this.fragmentSource = [
            this.fragmentSource,   // #version 300 es
            ...fnBodies,           // 依赖的函数体
            cleaned                // 主函数
        ].join('\n');
    }


    getVertexShaderSource() {
        return this.vertexSource;
    }

    getFragmentShaderSource() {
        return this.fragmentSource;
    }


    /**
     * Registers a shader function that can be used in shaders.
     * @param type
     * @param name
     * @param fn
     * @constructor
     * data: { name: string, fn: string } name: 函数名, fn: 函数
     */
    static RegisterShaderFn(type, name, fn) {
        if (type === "vertex") {
            this.vertexFns.push({ name, fn });
        }

        if (type === "fragment") {
            this.fragmentFns.push({ name, fn });
        }
    }
}