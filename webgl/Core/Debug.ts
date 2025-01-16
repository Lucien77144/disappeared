import * as TweakpaneEssentialsPlugin from '@tweakpane/plugin-essentials'
import * as TweakpanePluginMedia from 'tweakpane-plugin-media'
// @ts-ignore // @TODO: Fix the ts error on import
import * as TweakpaneFileImportPlugin from 'tweakpane-plugin-file-import'
import Experience from '../Experience'
import type { BladeState, FolderController, PluginPool } from '@tweakpane/core'
import Stats from './Stats'
import { Pane } from 'tweakpane'

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

	constructor() {
		// Private
		this._experience = new Experience()
		this._viewport = this._experience.viewport

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
		const foldersList: Array<`f_${string}`> = []
		const handleSave = (state: BladeState, key: string) => {
			return this._handleLocalSave(state, key)
		}
		const getDefaultState = (state: BladeState, key: string) => {
			return this._handleLocalValue(state, key)
		}

		this._pool.createApi = (function (original) {
			return function (bc) {
				if ((bc as FolderController).foldable) {
					bc = bc as FolderController

					const state = bc.exportState()
					const key = (state.title as string)?.toLowerCase().replace(/ /g, '-')
					const id: `f_${string}` = `f_${key}`

					if (foldersList.includes(id)) {
						console.warn(
							`The tag "${id}" is already used in the session storage`,
							bc
						)
					} else {
						foldersList.push(id)
					}

					bc.view.element.addEventListener('click', () => {
						const state = bc.exportState()
						handleSave(state, id)
					})

					const defaultState = getDefaultState(state, id)
					if (defaultState) bc.importState(defaultState)
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

		const handleSave = (state: BladeState) => this._handleLocalSave(state)
		const getDefaultState = (state: BladeState) => this._handleLocalValue(state)
		const tagsList: string[] = []
		const getStateTag = (state: BladeState) => this._getStateTag(state)

		this._pool.createBindingApi = (function (original) {
			return function (bc) {
				const valueElement = bc.view.valueElement
				valueElement.style.position = 'relative'
				valueElement.style.paddingRight = '20px'
				const clonedResetButton = resetButton.cloneNode(true) as HTMLElement
				valueElement.appendChild(clonedResetButton)

				const initialValue = bc.valueController.value.rawValue
				const initialState: any = bc.exportState()
				bc.tag = getStateTag(initialState)

				if (tagsList.includes(bc.tag)) {
					console.warn(
						`The tag "${bc.tag}" is already used in the session storage`,
						bc
					)
				} else {
					tagsList.push(bc.tag)
				}

				bc.value.emitter.on('change', (e) => {
					if (JSON.stringify(e.rawValue) === JSON.stringify(initialValue)) {
						clonedResetButton.style.color = '#65656e'
					} else {
						clonedResetButton.style.color = 'var(--btn-bg-a)'
					}

					handleSave(bc.exportState())
				})

				const defaultState = getDefaultState(initialState)
				if (defaultState) bc.importState(defaultState)

				clonedResetButton.addEventListener('click', () => {
					bc.valueController.value.setRawValue(initialValue)
				})

				// @ts-ignore
				return original.apply(this, arguments)
			}
		})(this._pool.createBindingApi)
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
				return `${state.binding?.key}-${parsedLabel}`
			} else {
				return `${key}`
			}
		}

		return state.tag
	}

	/**
	 * Handle local save
	 * @param state State of the binding
	 */
	private _handleLocalSave(state: any, key?: string) {
		const current = sessionStorage.getItem('debugParams')
		const res = current ? JSON.parse(current) : {}
		const tag = key ?? this._getStateTag(state)

		if (tag) {
			res[tag] = state
			sessionStorage.setItem('debugParams', JSON.stringify(res))
		}
	}

	/**
	 * Handle default local value
	 * @param state State of the binding
	 * @returns Default local value
	 */
	private _handleLocalValue(state: any, key?: string): any {
		const current = sessionStorage.getItem('debugParams')
		if (!current) return

		const values = JSON.parse(current)
		const tag = key ?? this._getStateTag(state)

		if (tag) return values[tag]
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

	/**
	 * Unset the stats panel
	 */
	public dispose() {
		this.panel.dispose()
		this.stats?.dispose()
		this._monitoring?.remove()
	}

	/**
	 * Update the debug panel
	 */
	public update() {
		if (this.debugParams.Stats) this._statsValues?.update()
	}
}
