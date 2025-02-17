// Uniforms
uniform sampler2D tDiffuse;
uniform sampler2D tNextDiffuse;
uniform float uTransition;
uniform vec2 uDirection;

// Varying
varying vec2 vUv;

void main() {
    vec2 uv = vUv;

    // -------------------- //
    //     Current Scene    //
    // -------------------- //
    vec2 currentSceneUV = vec2(uv.x, uv.y);
    currentSceneUV -= uDirection * uTransition;
    vec4 currentScene = texture2D(tDiffuse, currentSceneUV);

    // -------------------- //
    //       Next Scene     //
    // -------------------- //
    vec2 nextSceneUV = vec2(uv.x, uv.y);
    nextSceneUV -= uDirection * (uTransition - 1.0);
    vec4 nextScene = texture2D(tNextDiffuse, nextSceneUV);

    // -------------------- //
    //     Transition       //
    // -------------------- //
    bool isCurrentOutside = currentSceneUV.x > 1.0 || currentSceneUV.x < 0.0 ||
                           currentSceneUV.y > 1.0 || currentSceneUV.y < 0.0;
    bool isNextOutside = nextSceneUV.x > 1.0 || nextSceneUV.x < 0.0 ||
                        nextSceneUV.y > 1.0 || nextSceneUV.y < 0.0;

    if (isCurrentOutside) {
        gl_FragColor = isNextOutside ? vec4(0.0) : nextScene;
    } else {
        gl_FragColor = currentScene;
    }
}
