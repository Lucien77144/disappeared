uniform sampler2D tDiffuse;
uniform sampler2D tCube;
varying vec2 vUv;

void main() {
	vec2 uv = vUv;
	vec4 cube = texture2D(tCube, uv);
	vec4 diffuse = texture2D(tDiffuse, uv);

	gl_FragColor = mix(diffuse, cube, cube.a);
}
