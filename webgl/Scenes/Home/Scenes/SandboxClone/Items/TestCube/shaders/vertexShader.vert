varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vLocalPosition;

void main() {
	vUv = uv;
	vNormal = normalize(normal);
	vLocalPosition = position;
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
