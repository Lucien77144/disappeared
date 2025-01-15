import type { Intersection } from 'three'
import type { TCursorProps } from '~/utils/class/CursorManager'

export type TSuccessProp = boolean
export type TMouseHoverProps = TCursorProps & { target: Intersection }

export class ExtendableItemEvents {
  /**
   * Init function of the item
   * Automatically called
   */
  OnInit?(): void

  /**
   * After the parent scene has been fully built
   */
  OnSceneInitComplete?(): void

  /**
   * If set, this function will be called on each tick to update
   * If false, the event will be ignored, even if parent is triggering it
   */
  OnUpdate?(): void

  /**
   * After transition init function
   * Automatically called after the scene has been switched
   */
  OnDispose?(): void

  /**
   * If set, this function will be called on mouse down item
   * If false, the event will be ignored, even if parent is triggering it
   * @param {TCursorProps} event - Event of the mouse down
   */
  OnMouseMove?(event: TCursorProps): void

  /**
   * If set, this function will be called on mouse enter item
   * If false, the event will be ignored, even if parent is triggering it
   * @param {TCursorProps} event - Event of the mouse enter
   */
  OnMouseEnter?(event: TCursorProps): void

  /**
   * If set, this function will be called on mouse hover item
   * If false, the event will be ignored, even if parent is triggering it
   * @param {TMouseHoverProps} event - Event of the mouse hover
   */
  OnMouseHover?(event: TMouseHoverProps): void

  /**
   * If set, this function will be called on mouse leave item
   * If false, the event will be ignored, even if parent is triggering it
   * @param {TCursorProps} event - Event of the mouse leave
   */
  OnMouseLeave?(event: TCursorProps): void

  /**
   * On scroll function
   * If false, the event will be ignored, even if parent is triggering it
   * @param {TCursorProps} event - Event of the scroll
   */
  OnScroll?(event: TCursorProps): any

  /**
   * If set, this function will be called on click item
   * If false, the event will be ignored, even if parent is triggering it
   */
  OnClick?(): void

  /**
   * If set, this function will be called on hold item
   * If false, the event will be ignored, even if parent is triggering it
   * @param {boolean} success - If the hold was successful
   */
  OnHold?(success: TSuccessProp): void
}
