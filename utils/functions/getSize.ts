import type { Group, Object3D } from 'three'
import { Vector3 } from 'three'
import { Box3 } from 'three'

export function get3DSize(object: Object3D | Group): Vector3 {
	const sizeBox = new Box3().setFromObject(object)
	const size = new Vector3()
	sizeBox.getSize(size)
	return size
}
