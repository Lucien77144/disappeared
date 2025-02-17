uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    gl_FragColor = texture2D(tDiffuse, uv);
}
