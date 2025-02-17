uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
	vec2 uv = vUv;

	gl_FragColor = mix(texture2D(tDiffuse, uv), vec4(1.0, 0.0, 0.0, 1.0), 0.5);
}
