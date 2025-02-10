// Uniforms
uniform sampler2D tDiffuse;
uniform sampler2D tNextDiffuse;
uniform float uTransition;

// Varying
varying vec2 vUv;

void main() {
    vec2 uv = vUv;

    // -------------------- //
    //     Current Scene    //
    // -------------------- //
    vec2 currentSceneUV = vec2(uv.x, uv.y + uTransition);
    vec4 currentScene = texture2D(tDiffuse, currentSceneUV);

    // -------------------- //
    //       Next Scene     //
    // -------------------- //
    vec2 nextSceneUV = vec2(uv.x, uv.y - (1. - uTransition));
    vec4 nextScene = texture2D(tNextDiffuse, nextSceneUV);

    // -------------------- //
    //     Transition       //
    // -------------------- //
    gl_FragColor = (currentSceneUV.y > 1.0 || currentSceneUV.y < 0.0) ? nextScene : currentScene;
}
