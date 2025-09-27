import Shader from "./Shader.js";

// 注册一个加法器 (支持 float / vec2 / vec3 / vec4 重载)
Shader.RegisterShaderFn('vertex', 'add', `
    // 基础加法工具函数集合
    float add(float a, float b) { return a + b; }
    vec2 add(vec2 a, vec2 b) { return a + b; }
    vec3 add(vec3 a, vec3 b) { return a + b; }
    vec4 add(vec4 a, vec4 b) { return a + b; }
`)

/**
 * Phong 光照模型函数集合
 */
Shader.RegisterShaderFn('fragment', 'PhongLighting', `
    /**
     * Phong 环境光
     * materialColor: 物体漫反射基色 (通常来自材质/纹理)
     * ambientColor : 环境光颜色
     * ambientIntensity : 环境光强度(0~1)
     */
    vec3 PhongAmbient(vec3 materialColor, vec3 ambientColor, float ambientIntensity) {
        return materialColor * ambientColor * ambientIntensity; // 环境光分量
    }

    /**
     * Phong 漫反射 (Lambert)
     * normal:        顶点/片元法线 (世界或视图空间, 需与 posW / lightPosW 同空间)
     * posW:          片元位置
     * lightPosW:     光源位置
     * lightColor:    光源颜色 (可包含强度信息)
     * materialColor: 材质基础颜色
     */
    vec3 PhongDiffuse(vec3 normal, vec3 posW, vec3 lightPosW, vec3 lightColor, vec3 materialColor) {
        vec3 N = normalize(normal);
        vec3 L = normalize(lightPosW - posW);
        float NdotL = max(dot(N, L), 0.0);
        return lightColor * materialColor * NdotL; // 漫反射分量
    }

    /**
     * Phong 镜面反射
     * normal:        片元法线
     * posW:          片元位置
     * lightPosW:     光源位置
     * viewPosW:      观察者(摄像机)位置
     * shininess:     高光粗糙度(越大高光越小越锐利)
     * specularColor: 镜面高光颜色 (通常为白色 vec3(1.0))
     */
    vec3 PhongSpecular(vec3 normal, vec3 posW, vec3 lightPosW, vec3 viewPosW, float shininess, vec3 specularColor) {
        vec3 N = normalize(normal);
        vec3 L = normalize(lightPosW - posW);
        vec3 V = normalize(viewPosW - posW);
        vec3 R = reflect(-L, N);
        float specAngle = max(dot(V, R), 0.0);
        float specFactor = pow(specAngle, shininess);
        return specularColor * specFactor; // 镜面反射分量
    }

    /**
     * Phong 综合光照 (环境 + 漫反射 + 镜面)
     * 返回 vec4 最终颜色, alpha 由外部传入
     */
    vec4 PhongLighting(
        vec3 normal,
        vec3 posW,
        vec3 viewPosW,
        vec3 lightPosW,
        vec3 materialColor,
        vec3 ambientColor, float ambientIntensity,
        vec3 lightColor,
        vec3 specularColor, float shininess,
        float alpha
    ) {
        vec3 ambient  = PhongAmbient(materialColor, ambientColor, ambientIntensity);
        vec3 diffuse  = PhongDiffuse(normal, posW, lightPosW, lightColor, materialColor);
        vec3 specular = PhongSpecular(normal, posW, lightPosW, viewPosW, shininess, specularColor);
        return vec4(ambient + diffuse + specular, alpha);
    }
`);