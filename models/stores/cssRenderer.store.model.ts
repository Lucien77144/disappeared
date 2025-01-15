type TCSSRendererStore = {
  id: string
  template: any // component to render
  parent?: THREE.Object3D | THREE.Group | THREE.Scene // Parent object to attach
  position?: THREE.Vector3 // Position of the element
  rotation?: THREE.Euler // Rotation of the element
  scalar?: number // Scale of the element
  layers?: number // Layers to render the element
  el?: Element | null // Component ref
  data?: any // Data to pass to the component
  classList?: string // Class list to add to the element
}

export interface ICSS2DRendererStore extends TCSSRendererStore {
  center?: THREE.Vector2 // Center the element
}
export interface ICSS3DRendererStore extends TCSSRendererStore {
  sprite?: boolean // Render as sprite
}

export type TCSSRenderer = {
  css2DList: ICSS2DRendererStore[]
  css3DList: ICSS3DRendererStore[]
}
