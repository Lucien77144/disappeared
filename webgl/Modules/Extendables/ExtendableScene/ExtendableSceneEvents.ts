import type { TCursorProps } from '~/utils/class/CursorManager'

export class ExtendableSceneEvents {
  /**
   * Init function
   */
  public OnInit?(): any

  /**
   * On switch between scene complete and this scene is the new one
   */
  public OnInitComplete?(): any

  /**
   * Update function called each frame
   */
  public OnUpdate?(): any

  /**
   * On transition start, before the dispose
   */
  public OnDisposeStart?(): any

  /**
   * Dispose function to clean up the scene
   */
  public OnDispose?(): any

  /**
   * Resize function called on window resize
   */
  public OnResize?(): any

  /**
   * On scroll function
   * @param {TCursorProps} event - Event of the scroll
   */
  public OnScroll?(event: TCursorProps): any

  /**
   * On mouse down
   * @param {TCursorProps} event - Event of the mouse down
   */
  public OnMouseDown?(event: TCursorProps): any

  /**
   * On mouse up
   * @param {TCursorProps} event - Event of the mouse up
   */
  public OnMouseUp?(event: TCursorProps): any

  /**
   * On mouse move over the scene
   * @param {TCursorProps} event - Event of the mouse move
   */
  public OnMouseMove?(event: TCursorProps): any
}
