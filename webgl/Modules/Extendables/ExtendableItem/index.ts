import { BufferGeometry, Group, InstancedMesh, Material, Object3D } from 'three'
import Experience from '~/webgl/Experience'
import type { Dictionary } from '~/models/functions/dictionary.model'
import type { TAudioParams } from '~/models/utils/AudioManager.model'
import type { ICSS2DRendererStore } from '~/models/stores/cssRenderer.store.model'
import type { TDebugFolder } from '~/models/utils/Debug.model'
import type { ExtendableItemEvents } from './ExtendableItemEvents'
import type ExtendableScene from '../ExtendableScene'

/**
 * Item functions type
 */
export type TItemsEvents = keyof ExtendableItemEvents

/**
 * @class BasicItem
 *
 * @description Extandable class for items
 * @method TItemsFn Events can be implemented with ItemEvents
 *
 * @param { ExtendScene } parentScene Parent scene of the item
 * @param { ExtendableItem } parentComponent Parent component of the item
 * @param { Group | InstancedMesh | Object3D } item Item that will be added to the three scene
 * @param { Dictionary<ExtendableItem> } components Child components of the item
 * @param { Dictionary<TAudioParams> } audios Object of audios to add to the item (positionnal audio)
 * @param { TDebugFolder } debugFolder Debug folder
 * @param { number } holdDuration Duration after hold event is triggered
 * @param { TItemsEvents[] } disabledFn Disable any functions of the item
 * @param { Experience } experience Experience reference
 * @param { Experience['debug'] } debug Tweakpane debug reference
 */
export default class ExtendableItem implements Partial<ExtendableItemEvents> {
  // --------------------------------
  // Public properties
  // --------------------------------
  /**
   * Parent scene of the item
   * @description Null in the constructor
   */
  public parentScene?: ExtendableScene
  /**
   * Parent component of the item
   * @description Null in the constructor
   */
  public parentComponent?: ExtendableItem
  /**
   * Item that will be added to the three scene
   */
  public item: Object3D
  /**
   * Child components of the item
   * @description Will replace item by a group (including item) and add components to it
   */
  public components: Dictionary<ExtendableItem>
  /**
   * Object of audios to add to the item (positionnal audio)
   */
  public audios?: Dictionary<TAudioParams>
  /**
   * Debug folder
   */
  public debugFolder?: TDebugFolder
  /**
   * Duration after hold event is triggered
   */
  public holdDuration: number
  /**
   * Disable any functions of the item
   * @description Array of functions to disable
   */
  public disabledFn: TItemsEvents[]
  /**
   * Ignore any functions of the item
   * @description Array of functions to disable, instead of disabledFn, this will not disable the function for child components.
   */
  public ignoredFn: TItemsEvents[]

  // --------------------------------
  // Protected properties
  // --------------------------------
  /**
   * Experience reference
   */
  protected experience: Experience
  /**
   * Tweakpane debug reference
   */
  protected debug: Experience['debug']

  // --------------------------------
  // Public methods
  // --------------------------------
  /**
   * Constructor
   */
  constructor() {
    // Protected
    this.experience = new Experience()
    this.debug = this.experience.debug

    // Public
    this.item = new Group()
    this.components = {}
    this.holdDuration = 1000
    this.disabledFn = []
    this.ignoredFn = []
  }

  /**
   * Add CSS2D to the item
   * @param {ICSS2DRendererStore} item
   */
  public addCSS2D(item: ICSS2DRendererStore) {
    this.parentScene?.addCSS2D(item)
  }

  /**
   * Add CSS3D to the item
   * @param {ICSS2DRendererStore} item
   */
  public addCSS3D(item: ICSS2DRendererStore) {
    this.parentScene?.addCSS3D(item)
  }

  /**
   * Remove CSS2D element
   * @param {string} id
   */
  public removeCSS2D(id: string) {
    this.parentScene?.removeCSS2D(id)
  }

  /**
   * Remove CSS3D element
   * @param {string} id
   */
  public removeCSS3D(id: string) {
    this.parentScene?.removeCSS3D(id)
  }

  /**
   * Build instanced mesh
   * @param {BufferGeometry} geometry Geometry of the item
   * @param {TMaterial} material Material of the item
   * @param {any} list List of items to instance, with position and rotation
   * @returns {InstancedMesh} Instanced mesh
   */
  public buildInstancedMesh(
    geometry: BufferGeometry,
    material: Material,
    list: any[]
  ): InstancedMesh {
    const item = new InstancedMesh(geometry, material, list.length)

    const obj = new Object3D()
    list.forEach((el, i) => {
      if (el.position) {
        obj.position.set(el.position.x, el.position.y, el.position.z)
      }

      if (el.rotation) {
        obj.rotation.set(el.rotation.x, el.rotation.y, el.rotation.z)
      }

      if (el.scale) {
        obj.scale.set(el.scale.x, el.scale.y, el.scale.z)
      }

      obj.updateMatrix()
      item.setMatrixAt(i, obj.matrix)
    })

    item.instanceMatrix.needsUpdate = true

    return item
  }

  /**
   * Dispose function to remove the item
   * @warn super.dispose() is needed in the extending class
   */
  public OnDispose() {
    // Debug
    this.debugFolder && this.debug?.panel?.remove?.(this.debugFolder)
    this.item && this.parentScene?.scene.remove?.(this.item)
  }
}
