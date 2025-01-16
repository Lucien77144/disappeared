import { Group } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem/'
import { ExtendableItemEvents } from '~/webgl/Modules/Extendables/ExtendableItem/ExtendableItemEvents'
import type ScrollManager from '~/utils/class/ScrollManager'

export default class Garland
  extends ExtendableItem
  implements ExtendableItemEvents
{
  private _scrollManager: ScrollManager

  /**
   * Constructor
   */
  constructor() {
    super()

    // Get elements from experience
    this._scrollManager = this.experience.scrollManager
  }

  /**
   * Set item
   */
  public setItem() {
    this.item = this.resources.garland as Group

    console.log(this.item)
  }

  /**
   * On init
   */
  public OnInit(): void {
    this.setItem()
  }
}
