// Uniforms
uniform sampler2D tDiffuse;
uniform sampler2D tNextDiffuse;
uniform float uTransition;

// Varying
varying vec2 vUv;

void main() {
    vec2 uv = vUv;

    // Get textures
    vec4 currentScene = texture2D(tDiffuse, uv);
    vec4 nextScene = texture2D(tNextDiffuse, uv);

    // Mix
    gl_FragColor = mix(currentScene, nextScene, uTransition);
}
