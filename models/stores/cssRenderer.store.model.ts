import type { Euler, Group, Object3D, Scene, Vector2, Vector3 } from 'three'

type TCSSRendererStore = {
	id: string
	template: any // component to render
	parent?: Object3D | Group | Scene // Parent object to attach
	position?: Vector3 // Position of the element
	rotation?: Euler // Rotation of the element
	scalar?: number // Scale of the element
	layers?: number // Layers to render the element
	el?: Element | null // Component ref
	data?: any // Data to pass to the component
	classList?: string // Class list to add to the element
}

export interface ICSS2DRendererStore extends TCSSRendererStore {
	center?: Vector2 // Center the element
}
export interface ICSS3DRendererStore extends TCSSRendererStore {
	sprite?: boolean // Render as sprite
}

export type TCSSRenderer = {
	css2DList: ICSS2DRendererStore[]
	css3DList: ICSS3DRendererStore[]
}
