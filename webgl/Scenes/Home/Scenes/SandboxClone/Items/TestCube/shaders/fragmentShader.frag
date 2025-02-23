// Varyings
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vLocalPosition;

// Uniforms
uniform sampler2D tDiffuse;
uniform vec2 uScreenRatio;
uniform vec2 uFaceRatio;
uniform float uTestX;
uniform float uTestY;

void main() {
	vec2 uv = vUv;

	// Utiliser les normales locales (non affectées par la rotation)
	vec3 absNormal = abs(vNormal);

	// Calculer le ratio pour chaque face en utilisant les positions locales
	if(absNormal.x > absNormal.y && absNormal.x > absNormal.z) {
		// Face X (Left/Right)
	} else if(absNormal.y > absNormal.x && absNormal.y > absNormal.z) {
		// Face Y (Top/Bottom)
	} else {
		// Face Z (Front/Back)
		uv -= .5;
		uv.x *= uTestX;
		uv.y *= uTestY;
		uv += .5;
	}

	gl_FragColor = texture2D(tDiffuse, uv);
}
