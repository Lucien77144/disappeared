import { MathUtils } from 'three'
import Experience from '../Experience'
import gsap from 'gsap'
import scenes from '~/const/scenes.const'
import type {
  TSceneInfos,
  TSceneNavigation,
  TScenes,
} from '~/models/utils/SceneManager.model'
import type Renderer from '../Modules/Renderer/Renderer'
import type { TDebugFolder } from '~/models/utils/Debug.model'
import runMethod from '~/utils/runMethod'
import type ExtendableScene from '../Modules/Extendables/ExtendableScene'

const SCENES = scenes as TScenes

export default class SceneManager {
  // Public
  public scenes: TScenes
  public scale: number
  public start: number
  public active?: ExtendableScene
  public next?: ExtendableScene

  // Private
  private _experience: Experience
  private _renderer: Experience['renderer']
  private _store: Experience['store']
  private _scrollManager: Experience['scrollManager']
  private _debug: Experience['debug']
  private _debugNavigation?: TDebugFolder
  private _debugScene?: TDebugFolder
  private _renderMesh?: Renderer['renderMesh']
  private $bus: Experience['$bus']

  /**
   * Constructor
   */
  constructor() {
    // Public
    this.scenes = SCENES
    this.scale = 0
    this.start = 0

    // Private
    this._experience = new Experience()
    this._renderer = this._experience.renderer
    this._store = this._experience.store
    this._scrollManager = this._experience.scrollManager
    this._debug = this._experience.debug
    this.$bus = this._experience.$bus
  }

  /**
   * Set scene in storage and navigation stores
   * @param {TSceneInfos} scene Scene infos
   */
  public setScene(scene: TSceneInfos): void {
    if (!this._debug || !this._debugScene) return
    this._debugScene.value = scene.name
  }

  /**
   * Set scale
   * @param {number} scale
   */
  public setScale(scale: number): void {
    this.scale = scale
  }

  /**
   * Set start
   * @param {number} start
   */
  public setStart(start: number): void {
    this.start = start
  }

  /**
   * Update scroll
   * @param {number} val Scroll value, from 0 to 100
   */
  public navigate({ scroll, navigation }: TSceneNavigation): void {
    scroll && this._scrollManager?.to(scroll)
    navigation && this._setNavigation(navigation)

    navigation?.scene && this.setScene(navigation.scene)
    navigation?.scale && this.setScale(navigation.scale)
    navigation?.start && this.setStart(navigation.start)
  }

  /**
   * Switch scene
   * @param {TSceneInfos} nextInfos Destination scene
   */
  public switch(nextInfos: TSceneInfos): void {
    if (this.next) return
    if (this._debug) {
      this._debugNavigation.disabled = true // Disable the debug folder during the transition
    }

    // Disable scroll
    this._scrollManager?.setDisable(true)

    // Init next scene
    const previous = this.active?.name
    this.next = new nextInfos.Scene()

    // Switch function start on previous scene
    runMethod(this.active, 'OnDisposeStart')

    // Update the store (and localstorage) with the new scene :
    this.navigate({
      navigation: {
        scene: nextInfos,
        start: this.start,
        scale: this.scale,
      },
    })

    // Add render mesh if unset :
    const transition = nextInfos.transition
    this._renderMesh ??= this._renderer?.renderMesh
    if (!this._renderMesh) return

    // Get current scroll value
    const scroll = this._scrollManager?.current ?? 0

    // Smooth transition with gsap
    const nextIndex = this._findIndexByName(nextInfos.name)
    const previousIndex = this._findIndexByName(previous)
    const diff = nextIndex - previousIndex
    this._renderMesh.material.uniforms.uDirection.value = Math.sign(diff)

    const isHalf = { value: false }
    const duration = transition?.duration ? transition.duration / 1000 : 1000
    gsap.to(this._renderMesh?.material.uniforms.uTransition, {
      value: 1,
      duration,
      ease: 'power1.inOut',
      onUpdate: () => {
        // Progression of the transition :
        const progress = this._renderMesh?.material.uniforms.uTransition.value

        if (!isHalf.value && progress >= 0.5) {
          isHalf.value = true
          this.$bus?.emit('cssRender:toggle', nextInfos.name)
        }

        // Transition of values of progressBar
        this.navigate({
          navigation: {
            start: MathUtils.lerp(
              this.start,
              nextInfos.nav?.start ?? 0,
              progress
            ),
            scale: MathUtils.lerp(
              this.scale,
              nextInfos.nav?.scale ?? 0,
              progress
            ),
          },
          scroll: scroll * (1 - progress),
        })
      },
      onComplete: () => this._onSwitchComplete(nextInfos),
    })
  }

  /**
   * Init scene
   * @param {*} baseScene If set, initial scene name to load
   */
  public init(baseScene?: string): Promise<void> {
    // Set the scene name
    const name = baseScene ?? this.scenes.default.name

    // Debug
    if (this._debug && name) this._setDebug(name)

    // Get the scene from the store or the default one
    const scene = this._getSceneFromList(name)

    // Set navigation
    this.navigate({
      navigation: {
        scene,
        start: scene.nav?.start ?? 0,
        scale: scene.nav?.scale ?? 1,
      },
      scroll: 0,
    })

    // Init active scene
    this.active = new scene.Scene()

    // Switch complete function on the new scene
    runMethod(this.active, 'OnInitComplete')

    // Start navigation
    this.$bus?.on('scene:switch', (scene: TSceneInfos) => this.switch(scene))
    this.$bus?.emit('cssRender:toggle', scene.name)

    // Wait the scene to be built before starting the experience
    return new Promise((resolve) => {
      const scene = this.active?.scene
      const camera = this.active?.camera.instance
      const renderer = this._renderer?.instance

      if (!scene || !renderer || !camera) return resolve()

      scene.onAfterRender = () => {
        scene.onAfterRender = scene.onAfterRender
        resolve()
      }

      renderer.render(scene, camera)
      renderer.clear()
    })
  }

  /**
   * Update
   */
  public update(): void {
    runMethod(this.active, 'OnUpdate')
    runMethod(this.next, 'OnUpdate')
  }

  /**
   * Resize
   */
  public resize(): void {
    runMethod(this.active, 'OnResize')
    runMethod(this.next, 'OnResize')
  }

  /**
   * Dispose
   */
  public dispose(): void {
    runMethod(this.active, 'OnDispose')
    runMethod(this.next, 'OnDispose')
  }

  /**
   * On switch complete
   * @param infos Scene infos
   */
  private _onSwitchComplete(infos: TSceneInfos): void {
    // Reset navigation values
    this.navigate({
      navigation: {
        start: infos.nav?.start ?? 0,
        scale: infos.nav?.scale ?? 1,
      },
      scroll: 0,
    })

    // Reset transition uniform value :
    if (this._renderMesh) {
      this._renderMesh.material.uniforms.uTransition.value = 0
    }

    // Reset params :
    if (this._debug) {
      this._debugScene.value = infos.name
      this._debugNavigation.disabled = false
    }
    runMethod(this.active, 'OnDispose')
    this.active = this.next
    delete this.next

    // Switch complete function on the new scene
    this._scrollManager?.setDisable(false)
    runMethod(this.active, 'OnInitComplete')
  }

  /**
   * Set navigation in the store
   * @param navigation
   */
  private _setNavigation(navigation: Experience['store']['navigation']): void {
    this._store.navigation = navigation
  }

  /**
   * Set debug
   * @param {string} value of the debug
   */
  private _setDebug(value: string): void {
    this._debugNavigation = this._debug?.panel.addFolder({
      expanded: false,
      title: 'Navigation',
    })

    // Persist scene in local
    const persist = this._debugNavigation.addBinding(
      { value: false },
      'value',
      {
        label: 'Persist Scene',
      }
    )
    this._debug?.persist(persist)

    // Debug scene
    this._debugScene = this._debugNavigation.addBlade({
      view: 'list',
      label: 'scene',
      options: this.scenes.list.map((i) => ({
        text: i.Scene.name,
        value: i.Scene.name,
      })),
      value,
    })

    // Persist the folder and enable it
    this._debug?.persist(this._debugScene, persist.controller.value.rawValue)
    this._debugNavigation.disabled = false

    // Add switch event on change scene
    window.requestAnimationFrame(() =>
      this._debugScene.on('change', ({ value }: { value: string }) =>
        this.switch(this._getSceneFromList(value))
      )
    )
  }

  /**
   * Find index by name
   * @param {TSceneInfos['name']} name Scene name
   */
  private _findIndexByName(name?: string): number {
    return scenes.list.findIndex((s) => s.name === name)
  }

  /**
   * Get scene from list
   * @param {*} name Scene name
   */
  private _getSceneFromList(name?: string): TSceneInfos {
    return this.scenes.list.find((s) => s.name === name) || this.scenes.default
  }
}
