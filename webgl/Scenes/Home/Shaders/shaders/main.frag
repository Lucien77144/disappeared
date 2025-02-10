uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    gl_FragColor = texture2D(tDiffuse, uv);
    gl_FragColor.r = 1.0;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
