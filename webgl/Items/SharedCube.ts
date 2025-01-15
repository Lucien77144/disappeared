import { BoxGeometry, MathUtils, Mesh, MeshNormalMaterial } from 'three'
import { UIBtn } from '#components'
import type ScrollManager from '~/utils/class/ScrollManager'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem/'
import { ExtendableItemEvents } from '~/webgl/Modules/Extendables/ExtendableItem/ExtendableItemEvents'

export default class SharedCube
  extends ExtendableItem
  implements ExtendableItemEvents
{
  private _scrollManager: ScrollManager
  private _geometry?: BoxGeometry
  private _material?: MeshNormalMaterial
  private _mesh?: Mesh

  /**
   * Constructor
   */
  constructor() {
    super()

    // Get elements from experience
    this._scrollManager = this.experience.scrollManager

    // New elements
    this.holdDuration = 2000
    // this.components = {
    //   cube2: new Cube2({
    //     position: { x: 0, y: 0.5, z: 0 },
    //   }),
    // }
  }

  /**
   * Set geometry
   */
  public setGeometry() {
    this._geometry = new BoxGeometry(5, 5, 5)
  }

  /**
   * Set material
   */
  public setMaterial() {
    this._material = new MeshNormalMaterial({ wireframe: true })
  }

  /**
   * Set mesh
   */
  public setMesh() {
    this._mesh = new Mesh(this._geometry, this._material)
  }

  /**
   * Set item
   */
  public setItem() {
    this.item = this._mesh as Mesh
  }

  public OnHold(success: boolean) {
    if (success) {
      console.log(
        'hold successfull with a duration of ',
        this.holdDuration,
        'ms'
      )
    } else {
      console.log('hold canceled')
    }
  }

  /**
   * On click item
   */
  public OnClick() {
    console.log('clicked')
  }

  /**
   * Update the cube
   */
  public OnUpdate() {
    this.item.rotation.y = MathUtils.lerp(
      this.item.rotation.y,
      this._scrollManager.current * 0.1,
      0.1
    )
  }

  public OnInit(): void {
    this.setGeometry()
    this.setMaterial()
    this.setMesh()
    this.setItem()

    this.addCSS3D({
      id: 'test',
      template: UIBtn,
      parent: this.item,
      position: this.item.position,
      data: {
        text: 'Click me',
        onClick: () => this.OnClick(),
      },
    })
  }

  public override OnDispose(): void {
    super.OnDispose()
  }
}
