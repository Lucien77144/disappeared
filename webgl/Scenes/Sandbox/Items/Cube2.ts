import { BoxGeometry, Mesh, MeshToonMaterial } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import { ExtendableItemEvents } from '~/webgl/Modules/Extendables/ExtendableItem/ExtendableItemEvents'

export default class Cube2
  extends ExtendableItem
  implements ExtendableItemEvents
{
  // Public
  public position: { x: number; y: number; z: number }

  // Private
  private _geometry?: BoxGeometry
  private _material?: MeshToonMaterial
  private _mesh?: Mesh

  /**
   * Constructor
   */
  constructor(_options: { position: { x: number; y: number; z: number } }) {
    super()

    // New elements
    this.holdDuration = 2000
    this.position = _options.position
  }

  /**
   * Set geometry
   */
  public setGeometry() {
    this._geometry = new BoxGeometry(4, 4, 4)
  }

  /**
   * Set material
   */
  public setMaterial() {
    this._material = new MeshToonMaterial({ color: 0x00ff00 })
  }

  public setMesh() {
    this._mesh = new Mesh(this._geometry, this._material)
    this._mesh.position.set(this.position.x, this.position.y, this.position.z)
    this._mesh.scale.set(0.5, 0.5, 0.5)
    this.item = this._mesh as Mesh
  }

  /**
   * Init
   */
  public OnInit() {
    this.setGeometry()
    this.setMaterial()
    this.setMesh()
  }
}
