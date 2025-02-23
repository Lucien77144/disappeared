// Varyings
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vLocalPosition;

// Uniforms
uniform sampler2D tDiffuse;
uniform vec2 uScreenRatio;
uniform vec2 uFaceRatio;
uniform vec2 uSidesRatio;
uniform vec2 uTopRatio;

void main() {
	vec2 uv = vUv;

	// Utiliser les normales locales (non affectées par la rotation)
	vec3 absNormal = abs(vNormal);

	// Calculer le ratio pour chaque face en utilisant les positions locales
	uv -= .5;
	if(absNormal.x > absNormal.y && absNormal.x > absNormal.z) { // (Left/Right)
		uv *= uSidesRatio;
	} else if(absNormal.y > absNormal.x && absNormal.y > absNormal.z) { // (Top/Bottom)
		uv *= uTopRatio;
	} else { // (Front/Back)
		uv *= uFaceRatio;
	}
	uv += .5;

	gl_FragColor = texture2D(tDiffuse, uv);
}
