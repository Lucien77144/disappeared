import * as TweakpaneEssentialsPlugin from '@tweakpane/plugin-essentials'
import * as TweakpanePluginMedia from 'tweakpane-plugin-media'
// @ts-ignore // @TODO: Fix the ts error on import
import * as TweakpaneFileImportPlugin from 'tweakpane-plugin-file-import'
import Experience from '../Experience'
import type {
	BladeApi,
	BladeController,
	BladeState,
	Controller,
	FolderApi,
	FolderController,
	PluginPool,
} from '@tweakpane/core'
import Stats from './Stats'
import { Pane } from 'tweakpane'
import { defined } from '~/utils/functions/defined'

type TMonitoringValue = {
	name: string
	value: () => any
	element?: HTMLElement
	lastValue?: any
}

type TStatsValues = {
	monitoringValues: Array<TMonitoringValue>
	update: () => void
}

type TDebugParams = {
	SceneLogs: boolean
	ResourceLog: boolean
	Stats: boolean
	LoadingScreen: boolean
	Landing: boolean
}

const DEFAULT_SETTINGS: TDebugParams = {
	SceneLogs: true,
	ResourceLog: true,
	Stats: true,
	LoadingScreen: true,
	Landing: true,
}

/**
 * Debug class
 * @warning It is recommanded to use a tag in each blades to avoid conflicts the session storage
 */
export default class Debug {
	// Public
	public name!: string
	public panel!: Pane
	public debugParams!: TDebugParams
	public stats!: Stats

	// Private
	private _experience: Experience
	private _viewport: Experience['viewport']
	private _statsValues?: TStatsValues
	private _monitoring!: HTMLElement
	private _self: any
	private _activeDebugs: string[]

	constructor() {
		// Private
		this._experience = new Experience()
		this._viewport = this._experience.viewport
		this._activeDebugs = []

		// Public
		this._setPanel()
		this._saveFolderState()
		this._setPlugins()
		this._setHeaderButtons()
		this._setMoveEvent()
		this._setResizeEvent()
		this._setResetButton()
		this._setDebugManager()
		this._setStats()
		this._setMonitoring()
	}

	/**
	 * Get the plugin pool of the pane
	 */
	private get _pool(): PluginPool {
		return this._self.pool_
	}

	/**
	 * Get the UI container of the panel
	 */
	private get _uiContainer() {
		return this.panel.element.parentElement as HTMLElement
	}

	/**
	 * Get the UI content of the panel
	 */
	private get _uiContent() {
		return this._uiContainer.querySelector('.tp-rotv_c') as HTMLElement
	}

	/**
	 * Get the UI title of the panel
	 */
	private get _uiTitle() {
		return this.panel.element.children[0] as HTMLElement
	}

	/**
	 * Get the stack ID
	 * @param state State of the blade
	 * @returns Stack ID
	 */
	private async _getStackID(
		state: BladeState,
		el: HTMLElement
	): Promise<string> {
		let res = ''
		const getParentElement = (el: HTMLElement) => {
			if (el.classList.contains('tp-rotv_c')) return
			if (el.classList.contains('tp-fldv')) {
				const child = el.querySelector('.tp-fldv_b>.tp-fldv_t')
				if (child) {
					res += `-${child.textContent}`
				}
			}

			if (el.parentElement) {
				return getParentElement(el.parentElement)
			}
		}
		getParentElement(el)

		const tag = this._getStateTag(state)
		async function hashString(input: string): Promise<string> {
			const encoder = new TextEncoder()
			const data = encoder.encode(input)
			const hashBuffer = await crypto.subtle.digest('SHA-256', data)
			const hashArray = Array.from(new Uint8Array(hashBuffer))
			const code = hashArray
				.map((byte) => byte.toString(16).padStart(2, '0'))
				.join('')
				.slice(0, 8)

			return `${tag}-${code}`
		}

		return tag && hashString(res)
	}

	/**
	 * Get the state tag
	 * @param state State of the binding
	 * @returns State tag
	 */
	private _getStateTag(state: any): string {
		if (!state.tag) {
			const key = state.binding?.key
			const parsedLabel = state.label?.toLowerCase().replace(/ /g, '-')

			if (key !== state.label) {
				return `${state.binding?.key}${parsedLabel ? '-' + parsedLabel : ''}`
			} else {
				return key && `${key}`
			}
		}

		return state.tag
	}

	/**
	 * Remove a folder from the panel
	 * @param debug Debug folder
	 */
	public async remove(debug: FolderApi | BladeApi) {
		const id = debug.element.id

		const childs = (debug as FolderApi).children
		childs?.forEach((child: BladeApi | FolderApi) => this.remove(child))

		// Check if this is a folder
		this._activeDebugs = this._activeDebugs.filter((tag) => tag !== id)

		this.panel.remove(debug)
	}

	/**
	 * Unset the stats panel
	 */
	public dispose() {
		this.panel.dispose()
		this._activeDebugs = []
		this.stats?.dispose()
		this._monitoring?.remove()
	}

	/**
	 * Update the debug panel
	 */
	public update() {
		if (this.debugParams.Stats) this._statsValues?.update()
	}

	/**
	 * Set the panel
	 */
	private _setPanel() {
		this.name = `Debug - ${this._experience.name}`
		this.panel = new Pane({ title: '⚙️ ' + this.name })
		this._self = this.panel as any
		this.debugParams = DEFAULT_SETTINGS

		// Set the container style
		this._uiContainer.style.position = 'fixed'
		this._uiContainer.style.zIndex = '1000'
		this._uiContainer.style.userSelect = 'none'

		// Set the content style
		this._uiContent.style.maxHeight = '80vh'
		this._uiContent.style.overflowY = 'auto'
	}

	/**
	 * Save the folder state
	 */
	private _saveFolderState() {
		const getStackId = async (state: BladeState, element: HTMLElement) => {
			return await this._getStackID(state, element)
		}
		const handleSave = (id: string, state: BladeState) =>
			this._handleLocalSave(id, state)

		const getDefaultState = (id: string) => this._handleLocalValue(id)
		const isActive = (id: string) => this._activeDebugs.includes(id)
		const addToList = (id: string) => this._activeDebugs.push(id)

		this._pool.createApi = (function (original) {
			return function (bc) {
				if ((bc as FolderController).foldable) {
					bc = bc as FolderController

					const state = bc.exportState()

					// Used to prevent issues on scene changes
					window.requestAnimationFrame(() => {
						// Wait the panel to build element
						const element = bc.view.element
						getStackId(state, element).then((id) => {
							if (!id) return
							element.id = id

							if (isActive(id)) {
								console.warn(
									`The tag "${id}" is already used in the session storage`,
									bc
								)
							} else {
								addToList(id)
							}

							const defaultState = getDefaultState(id)
							if (defaultState) bc.importState(defaultState)

							bc.view.element.addEventListener('click', () => {
								const state = bc.exportState()
								handleSave(id, state)
							})
						})
					})
				}

				// @ts-ignore
				return original.apply(this, arguments)
			}
		})(this._pool.createApi)
	}

	/**
	 * Set panel plugins from Tweakpane
	 */
	private _setPlugins() {
		this.panel.registerPlugin(TweakpaneEssentialsPlugin)
		this.panel.registerPlugin(TweakpanePluginMedia)
		this.panel.registerPlugin(TweakpaneFileImportPlugin)
	}

	/**
	 * Set import/export buttons
	 */
	private _setHeaderButtons() {
		const blade = this.panel.addBlade({
			view: 'buttongrid',
			size: [3, 1],
			cells: (x: number, y: number) => ({
				title: [['Import', 'Export', 'Reset']][y][x],
			}),
		}) as any

		blade.on('click', (event: any) => {
			if (event.index[0] === 0) return this._handleImport()
			else if (event.index[0] === 1) return this._handleExport()
			else if (event.index[0] === 2) return this._handleReset()
		})
	}

	/**
	 * Handle import
	 */
	private _handleImport() {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = '.json'
		input.onchange = ({ target }: any) => {
			const file = target?.files[0]
			const reader = new FileReader()

			reader.onload = (_) => {
				const data = JSON.parse(target?.result)
				this.panel.importState(data)
			}
			reader.readAsText(file)
		}
		input.click()
	}

	/**
	 * Handle export
	 */
	private _handleExport() {
		const data = this.panel.exportState()
		const element = document.createElement('a')
		const file = new Blob([JSON.stringify(data)], {
			type: 'application/json',
		})

		element.href = URL.createObjectURL(file)
		element.download = 'preset.json'

		document.body.appendChild(element) // Required for this to work in FireFox
		element.click()
		element.remove()
	}

	/**
	 * Handle reset
	 */
	private _handleReset() {
		sessionStorage.removeItem('debugParams')
		this._uiContent
			.querySelectorAll('.tp-reset-button')
			.forEach((button: any) => button.click())
	}

	/**
	 * Set the move event on the panel
	 */
	private _setMoveEvent() {
		this._uiTitle.childNodes.forEach((child: any) => {
			child.style.pointerEvents = 'none'
		})

		let move = (_: MouseEvent) => {}
		let hasMoved = true
		const handleMouseDown = (event: any) => {
			this._uiTitle.style.cursor = 'grabbing'
			const clickTargetX = event.layerX
			const clickTargetWidth = event.target?.clientWidth
			const clickTargetY = event.layerY

			move = ({ clientX, clientY }) => {
				hasMoved = true

				this._uiContainer.style.right = `${
					this._viewport.width - clientX - (clickTargetWidth - clickTargetX)
				}px`
				this._uiContainer.style.top = `${clientY - clickTargetY}px`
			}

			document.addEventListener('mousemove', move)
		}
		const handleMouseUp = () => {
			this._uiTitle.style.cursor = ''

			if (hasMoved) {
				this.panel.controller.foldable.set(
					'expanded',
					!this.panel.controller.foldable.get('expanded')
				)
				hasMoved = false
			}

			document.removeEventListener('mousemove', move)
		}

		this._uiTitle.addEventListener('mousedown', handleMouseDown)
		this._uiTitle.addEventListener('mouseup', handleMouseUp)
	}

	/**
	 * Set the resize event on the panel
	 */
	private _setResizeEvent() {
		this._uiContainer.style.minWidth = '280px'

		const styleElement = document.createElement('style')
		styleElement.innerHTML = `
		.tp-lblv_v { flex-grow: 1 }
		.tp-lblv_l { min-width: 64px; max-width: 100px;}
		.horizontal-resize { position: absolute; left: -3px; top: 0; bottom: 0; width: 5px; cursor: ew-resize; }
		.horizontal-resize:hover { background-color: #ffffff10; }
		`
		document.head.appendChild(styleElement)

		const horizontalResizeElement = document.createElement('div')
		horizontalResizeElement.classList.add('horizontal-resize')
		this._uiContainer.appendChild(horizontalResizeElement)
		horizontalResizeElement.addEventListener('mousedown', (event) => {
			this._uiContainer.style.pointerEvents = 'none'
			const clickTargetX = event.clientX
			const clickTargetWidth = this._uiContainer.clientWidth

			const handleMouseMove = ({ clientX }: MouseEvent) => {
				this._uiContainer.style.width = `${
					clickTargetWidth - (clientX - clickTargetX)
				}px`
			}

			const handleMouseUp = () => {
				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('mouseup', handleMouseUp)
				this._uiContainer.style.pointerEvents = ''
			}

			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
		})
	}

	/**
	 * Set the reset button on the panels bindings
	 */
	private _setResetButton() {
		const resetButton = document.createElement('button')
		resetButton.classList.add('tp-reset-button')
		const styleElement = document.createElement('style')
		styleElement.innerHTML = `
			.tp-reset-button {
				position: absolute;
				right: 0;
				top: 0;
				bottom: 0;
				width: 20px;
				height: 20px;
				padding: 2px !important;
				margin: auto;
				color: #65656e;
				background: none;
				border: none;
				cursor: pointer;
			}
			.tp-reset-button:hover {
				color: var(--btn-bg-h) !important;
			}
		`
		document.head.appendChild(styleElement)
		resetButton.innerHTML = `↺`

		const handleSave = (id: string, state: BladeState) =>
			this._handleLocalSave(id, state)
		const getDefaultState = (id: string) => this._handleLocalValue(id)
		const isActive = (id: string) => this._activeDebugs.includes(id)
		const addToList = (id: string) => this._activeDebugs.push(id)
		const getStackId = async (state: BladeState, element: HTMLElement) => {
			return await this._getStackID(state, element)
		}

		this._pool.createBindingApi = (function (original) {
			return function (bc) {
				const valueElement = bc.view.valueElement
				valueElement.style.position = 'relative'
				valueElement.style.paddingRight = '20px'
				const clonedResetButton = resetButton.cloneNode(true) as HTMLElement
				valueElement.appendChild(clonedResetButton)

				const initialValue = bc.valueController.value.rawValue
				const initialState: any = bc.exportState()

				window.requestAnimationFrame(() => {
					// Wait the panel to build element
					const element = bc.view.element
					getStackId(initialState, element).then((id) => {
						if (!id) return
						element.id = id

						if (isActive(id)) {
							console.warn(
								`The tag "${id}" is already used in the session storage`,
								bc
							)
						} else {
							addToList(id)
						}

						bc.value.emitter.on('change', (e) => {
							if (JSON.stringify(e.rawValue) === JSON.stringify(initialValue)) {
								clonedResetButton.style.color = '#65656e'
							} else {
								clonedResetButton.style.color = 'var(--btn-bg-a)'
							}

							handleSave(id, bc.exportState())
						})

						const defaultState = getDefaultState(id)
						if (defaultState) {
							bc.importState(defaultState)
							window.requestAnimationFrame(() => {
								bc.importState(defaultState)
							})
						}

						clonedResetButton.addEventListener('click', () => {
							bc.valueController.value.setRawValue(initialValue)
						})
					})
				})

				// @ts-ignore
				return original.apply(this, arguments)
			}
		})(this._pool.createBindingApi)
	}

	/**
	 * Handle local save
	 * @param id ID of the binding
	 * @param state State of the binding
	 */
	private _handleLocalSave(id: string, state: any) {
		const current = sessionStorage.getItem('debugParams')
		const res = current ? JSON.parse(current) : {}

		if (id) {
			res[id] = state
			sessionStorage.setItem('debugParams', JSON.stringify(res))
		} else {
			console.warn('The key is not defined', state)
		}
	}

	/**
	 * Handle default local value
	 * @param id ID of the binding
	 * @returns Default local value
	 */
	private _handleLocalValue(id: string): any {
		const current = sessionStorage.getItem('debugParams')
		if (!current) return

		const values = JSON.parse(current)
		const res = values[id]

		if (defined(res?.disable)) {
			res.disable = false
		}

		if (id) return res
	}

	/**
	 * Set the debug manager
	 */
	private _setDebugManager() {
		const debugManager = this.panel.addFolder({
			title: 'Debug Feature Manager',
			expanded: false,
		})

		const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof TDebugParams>
		keys.forEach((key) =>
			debugManager.addBinding(this.debugParams, key).on('change', () => {
				switch (key) {
					case 'Stats':
						if (this.debugParams.Stats) {
							this.stats?.enable()
							this._monitoring.style.display = 'flex'
						} else {
							this.stats?.disable()
							this._monitoring.style.display = 'none'
						}
					case 'LoadingScreen':
						const loadingScreen = this.debugParams.LoadingScreen
						this._experience.store.loadingScreen = loadingScreen
					case 'Landing':
						const landing = this.debugParams.Landing
						this._experience.store.landing = landing
				}
			})
		)

		this._experience.store.loadingScreen = this.debugParams.LoadingScreen
		this._experience.store.landing = this.debugParams.Landing
	}

	/**
	 * Set the stats panel
	 */
	private _setStats() {
		this.stats = new Stats(this.debugParams.Stats)
	}

	/**
	 * Set the monitoring panel
	 */
	private _setMonitoring() {
		const monitoringValues: Array<TMonitoringValue> = [
			{
				name: 'Calls',
				value: () => this._experience.renderer.instance.info.render.calls,
			},
			{
				name: 'Triangles',
				value: () => this._experience.renderer.instance.info.render.triangles,
			},
			{
				name: 'Lines',
				value: () => this._experience.renderer.instance.info.render.lines,
			},
			{
				name: 'Points',
				value: () => this._experience.renderer.instance.info.render.points,
			},
			{
				name: 'Geometries',
				value: () => this._experience.renderer.instance.info.memory.geometries,
			},
			{
				name: 'Materials',
				value: () => this._experience.renderer.instance.info.programs?.length,
			},
			{
				name: 'Textures',
				value: () => this._experience.renderer.instance.info.memory.textures,
			},
		]

		this._monitoring = document.createElement('section')
		Object.assign(this._monitoring.style, {
			position: 'fixed',
			bottom: '1rem',
			left: '1rem',
			pointerEvents: 'none',
			userSelect: 'none',
			zIndex: '1000',
			display: 'flex',
			gap: '1rem',
			fontSize: '12px',
		})

		monitoringValues.forEach((monitoringValue) => {
			const monitoringValueElement = document.createElement('span')
			monitoringValueElement.id = monitoringValue.name.toLowerCase()

			monitoringValue.element = monitoringValueElement
			this._monitoring.appendChild(monitoringValueElement)
		})

		document.body.appendChild(this._monitoring)

		this._statsValues = {
			monitoringValues,
			update: () => {
				this.stats?.update()
				monitoringValues.forEach((monitoringValue) => {
					if (monitoringValue.value() === monitoringValue.lastValue) return
					monitoringValue.lastValue = monitoringValue.value()
					if (!monitoringValue.element) return
					monitoringValue.element.innerHTML = `<b>${monitoringValue.lastValue}</b> ${monitoringValue.name}`
				})
			},
		}
	}
}
