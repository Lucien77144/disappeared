uniform vec2 uRatio;
varying vec2 vUv;

void main() {
	vUv = uv * uRatio;

	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
