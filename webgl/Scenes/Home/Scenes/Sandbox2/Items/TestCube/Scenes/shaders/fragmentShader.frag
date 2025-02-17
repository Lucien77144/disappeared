uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;

		vec4 diffuse = texture2D(tDiffuse, uv);
		gl_FragColor = mix(diffuse, vec4(0., 1., 0., 1.), .5);
}
