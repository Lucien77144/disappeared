uniform sampler2D uScene0;
uniform sampler2D uScene1;
uniform float uTime;
uniform float uTransition;
uniform float uDirection;
uniform vec2 uResolution;
uniform vec2 uCursor;
uniform vec2 uRatio;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec4 frag = vec4(0.);

    // -------------------- //
    //       Scene 0        //
    // -------------------- //
    vec2 scene0UV = vec2(uv.x,uv.y+uTransition);
    vec4 scene0 = texture2D(uScene0, scene0UV);

    // -------------------- //
    //       Scene 1        //
    // -------------------- //
    vec2 scene1UV = vec2(uv.x, uv.y - (1. - uTransition));
    vec4 scene1 = texture2D(uScene1, scene1UV);

    // -------------------- //
    //     Transition       //
    // -------------------- //
    frag = mix(scene0, scene1, uTransition);

    gl_FragColor = frag;
    #include <tonemapping_fragment> // To fix tonemapping problems when using render targets (only if tone mapping is enabled)
    #include <colorspace_fragment> // To fix colors problems when using render targets
}