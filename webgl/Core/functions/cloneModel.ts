import { Skeleton, SkinnedMesh, Bone, Object3D } from 'three'
import type { GLTF } from 'three/examples/jsm/Addons.js'

/**
 * Type for cloned GLTF model
 */
type ClonedGLTF = {
	animations: GLTF['animations']
	scene: Object3D
}

/**
 * Type for mapping skinned meshes by name
 */
type SkinnedMeshMap = {
	[key: string]: SkinnedMesh
}

/**
 * Type for mapping bones by name
 */
type BoneMap = {
	[key: string]: Bone
}

/**
 * Clone a GLTF model with proper skeleton binding
 * @param model Original GLTF model to clone
 * @returns Cloned GLTF model with properly bound skeletons
 */
export default function cloneModel<T extends GLTF | Object3D>(
	model: T
): ClonedGLTF {
	// Create initial clone with animations and scene
	const clone: ClonedGLTF = {
		animations: (model as GLTF).animations || [],
		scene:
			(model as GLTF).scene?.clone(true) || (model as Object3D).clone(true),
	}

	// Maps to store references
	const skinnedMeshes: SkinnedMeshMap = {}
	const cloneBones: BoneMap = {}
	const cloneSkinnedMeshes: SkinnedMeshMap = {}

	// Get original skinned meshes
	const originalScene = (model as GLTF).scene || (model as Object3D)
	originalScene.traverse((node: Object3D) => {
		if ((node as SkinnedMesh).isSkinnedMesh) {
			skinnedMeshes[node.name] = node as SkinnedMesh
		}
	})

	// Get cloned bones and skinned meshes
	clone.scene.traverse((node: Object3D) => {
		if ((node as Bone).isBone) {
			cloneBones[node.name] = node as Bone
		}

		if ((node as SkinnedMesh).isSkinnedMesh) {
			cloneSkinnedMeshes[node.name] = node as SkinnedMesh
		}

		if ((node as Object3D).isObject3D) {
			node.position.copy(node.position)
		}
	})

	// Rebind skeletons
	for (const name in skinnedMeshes) {
		const skinnedMesh = skinnedMeshes[name]
		const skeleton = skinnedMesh.skeleton
		const cloneSkinnedMesh = cloneSkinnedMeshes[name]

		// Create ordered bone array matching original skeleton
		const orderedCloneBones: Bone[] = []
		for (let i = 0; i < skeleton.bones.length; ++i) {
			const cloneBone = cloneBones[skeleton.bones[i].name]
			orderedCloneBones.push(cloneBone)
		}

		// Bind new skeleton to cloned mesh
		cloneSkinnedMesh.bind(
			new Skeleton(orderedCloneBones, skeleton.boneInverses),
			cloneSkinnedMesh.matrixWorld
		)
	}

	return clone
}
