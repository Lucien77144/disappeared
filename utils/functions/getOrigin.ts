import type { Group, Object3D } from 'three'
import { Vector3 } from 'three'
import { Box3 } from 'three'

export function getOrigin(object: Object3D | Group): Vector3 {
	const box = new Box3().setFromObject(object)
	return box.getCenter(new Vector3())
}
