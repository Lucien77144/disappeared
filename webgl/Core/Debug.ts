import * as TweakpaneEssentialsPlugin from '@tweakpane/plugin-essentials'
import * as TweakpanePluginMedia from 'tweakpane-plugin-media'
// @ts-ignore // @TODO: Fix the ts error on import
import * as TweakpaneFileImportPlugin from 'tweakpane-plugin-file-import'
import Experience from '../Experience'
import type {
	BladeApi,
	BladeState,
	FolderApi,
	FolderController,
	PluginPool,
} from '@tweakpane/core'
import Stats from './Stats'
import { Pane } from 'tweakpane'
import { defined } from '~/utils/functions/defined'
import { copyObject } from '~/utils/functions/copyObject'

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
	#experience: Experience
	#viewport: Experience['viewport']
	#statsValues?: TStatsValues
	#monitoring!: HTMLElement
	#self: any
	#loading!: boolean
	#controls: number
	#readyControls: Array<string>

	constructor() {
		// Public
		this.#controls = 0
		this.#readyControls = []

		// Private
		this.#experience = new Experience()
		this.#viewport = this.#experience.viewport

		// Set the Debug
		this.#setPanel()
		this.#saveFolderState()
		this.#setPlugins()
		this.#setHeaderButtons()
		this.#setMoveEvent()
		this.#setResizeEvent()
		this.#setResetButton()
		this.#setDebugManager()
		this.#setStats()
		this.#setMonitoring()
	}

	/**
	 * Set the loading state of the debug panel
	 */
	set loading(val: boolean) {
		this.#loading = val && this.#readyControls.length !== this.#controls
	}

	/**
	 * Get the loading state of the debug panel
	 */
	get loading() {
		return this.#loading
	}

	/**
	 * Get the plugin pool of the pane
	 */
	get #pool(): PluginPool {
		return this.#self.pool_
	}

	/**
	 * Get the UI container of the panel
	 */
	get #uiContainer() {
		return this.panel.element.parentElement as HTMLElement
	}

	/**
	 * Get the UI content of the panel
	 */
	get #uiContent() {
		return this.#uiContainer.querySelector('.tp-rotv_c') as HTMLElement
	}

	/**
	 * Get the UI title of the panel
	 */
	get #uiTitle() {
		return this.panel.element.children[0] as HTMLElement
	}

	/**
	 * Get the stack ID
	 * @param state State of the blade
	 * @returns Stack ID
	 */
	async #getStackID(
		state: BladeState,
		el: HTMLElement
	): Promise<string | undefined> {
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

		const tag = this.#getStateTag(state)
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

		// Check if el is in the dom :
		const isInDom = document.body.contains(el)
		if (isInDom && tag) {
			return hashString(res)
		}
	}

	/**
	 * Get the state tag
	 * @param state State of the binding
	 * @returns State tag
	 */
	#getStateTag(state: any): string {
		let res = state.tag
		if (!res) {
			const key = state.binding?.key
			const name = state.label ?? state.title
			const filteredName = name.replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '')
			const parsedName = filteredName
				?.toLowerCase()
				.replace(/ /g, '-')
				?.replace(/[^a-z0-9-_]/g, '')
				?.replace(/--+/g, '-')
				?.replace(/^-/, '')

			if (key !== parsedName) {
				res = `${key ? key + '-' : ''}${parsedName ? parsedName : ''}`
			} else {
				res = key && `${key}`
			}
		}

		// Ensure the result starts with a letter (CSS requirement)
		if (res && /^[^a-zA-Z]/.test(res)) {
			res = 'debug-' + res
		}

		return res
	}

	/**
	 * Remove a folder from the panel
	 * @param debug Debug folder
	 */
	public async remove(debug: FolderApi | BladeApi) {
		const childs = (debug as FolderApi).children
		childs?.forEach((child: BladeApi | FolderApi) => this.remove(child))

		this.panel.remove(debug)
	}

	/**
	 * Unset the stats panel
	 */
	public dispose() {
		this.#controls = 0
		this.#readyControls = []

		this.panel.dispose()
		this.stats?.dispose()
		this.#monitoring?.remove()
	}

	/**
	 * Update the debug panel
	 */
	public update() {
		if (this.debugParams.Stats) this.#statsValues?.update()
	}

	/**
	 * Set the panel
	 */
	#setPanel() {
		this.name = `Debug - ${this.#experience.name}`
		this.panel = new Pane({ title: '⚙️ ' + this.name })
		this.#self = this.panel as any
		this.debugParams = DEFAULT_SETTINGS

		// Set the container style
		this.#uiContainer.style.position = 'fixed'
		this.#uiContainer.style.zIndex = '9999'
		this.#uiContainer.style.userSelect = 'none'

		// Set the content style
		this.#uiContent.style.maxHeight = '80vh'
		this.#uiContent.style.overflowY = 'auto'
	}

	/**
	 * Add a control
	 * @param id ID of the control, if set, it will be added to the ready controls, else it will increase the controls count
	 */
	#controlsChange(add: boolean, id?: string) {
		if (!add) {
			this.#controls--
			this.loading = false
		} else {
			if (!id) {
				this.#controls++
				this.loading = true
			} else {
				this.#readyControls.push(id)
				this.loading = false
			}
		}
	}

	/**
	 * Save the folder state
	 */
	#saveFolderState() {
		const getDefaultState = (id: string) => this.#handleLocalValue(id)
		const isActive = (id: string) => this.#isActive(id)
		const getStackId = async (state: BladeState, element: HTMLElement) => {
			return await this.#getStackID(state, element)
		}
		const handleSave = (id: string, state: BladeState) => {
			this.#handleLocalSave(id, state)
		}
		const controlsChange = (add: boolean, id?: string) => {
			this.#controlsChange(add, id)
		}

		this.#pool.createApi = (function (original) {
			return function (bc) {
				if ((bc as FolderController).foldable) {
					controlsChange(true)
					bc = bc as FolderController

					const state = bc.exportState()
					// disable animation
					const el = bc.view.element
					const contentEl = el.querySelector('.tp-fldv_c') as HTMLElement
					if (contentEl) contentEl.style.transition = 'none'

					// Check if the folder has no children
					const childs = state?.children as any[]
					if (defined(childs) && !childs.length) {
						state.hidden = true
					}

					// Used to prevent issues on scene changes
					window.requestAnimationFrame(() => {
						// Wait the panel to build element
						const element = bc.view.element
						getStackId(state, element).then((id) => {
							if (!id) return controlsChange(false)
							element.id = id
							element.classList.add(id)

							if (isActive(id)) {
								console.warn(
									`The debug "${state.title}" is already used in the session storage`,
									bc
								)
							}

							// Default state
							const defaultState = getDefaultState(id)
							const defaultChilds = defaultState?.children
							if (defined(defaultChilds) && !defaultChilds.length) {
								defaultState.hidden = true
							}
							if (defaultState) bc.importState(defaultState)

							window.requestAnimationFrame(() => {
								if (contentEl) contentEl.style.transition = ''
							})

							// Add the control to the ready controls
							controlsChange(true, id)

							// Click event
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
		})(this.#pool.createApi)
	}

	/**
	 * Set panel plugins from Tweakpane
	 */
	#setPlugins() {
		this.panel.registerPlugin(TweakpaneEssentialsPlugin)
		this.panel.registerPlugin(TweakpanePluginMedia)
		this.panel.registerPlugin(TweakpaneFileImportPlugin)
	}

	/**
	 * Set import/export buttons
	 */
	#setHeaderButtons() {
		const blade = this.panel.addBlade({
			view: 'buttongrid',
			size: [3, 1],
			cells: (x: number, y: number) => ({
				title: [['Import', 'Export', 'Reset']][y][x],
			}),
		}) as any

		blade.on('click', (event: any) => {
			if (event.index[0] === 0) return this.#handleImport()
			else if (event.index[0] === 1) return this.#handleExport()
			else if (event.index[0] === 2) return this.#handleReset()
		})
	}

	/**
	 * Handle import
	 */
	#handleImport() {
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
	#handleExport() {
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
	#handleReset() {
		sessionStorage.removeItem('debugParams')
		this.#uiContent
			.querySelectorAll('.tp-reset-button')
			.forEach((button: any) => button.click())
	}

	/**
	 * Set the move event on the panel
	 */
	#setMoveEvent() {
		this.#uiTitle.childNodes.forEach((child: any) => {
			child.style.pointerEvents = 'none'
		})

		let move = (_: MouseEvent) => {}
		let hasMoved = true
		const handleMouseDown = (event: any) => {
			this.#uiTitle.style.cursor = 'grabbing'
			const clickTargetX = event.layerX
			const clickTargetWidth = event.target?.clientWidth
			const clickTargetY = event.layerY

			move = ({ clientX, clientY }) => {
				hasMoved = true

				this.#uiContainer.style.right = `${
					this.#viewport.width - clientX - (clickTargetWidth - clickTargetX)
				}px`
				this.#uiContainer.style.top = `${clientY - clickTargetY}px`
			}

			document.addEventListener('mousemove', move)
		}
		const handleMouseUp = () => {
			this.#uiTitle.style.cursor = ''

			if (hasMoved) {
				this.panel.controller.foldable.set(
					'expanded',
					!this.panel.controller.foldable.get('expanded')
				)
				hasMoved = false
			}

			document.removeEventListener('mousemove', move)
		}

		this.#uiTitle.addEventListener('mousedown', handleMouseDown)
		this.#uiTitle.addEventListener('mouseup', handleMouseUp)
	}

	/**
	 * Set the resize event on the panel
	 */
	#setResizeEvent() {
		this.#uiContainer.style.minWidth = '280px'

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
		this.#uiContainer.appendChild(horizontalResizeElement)
		horizontalResizeElement.addEventListener('mousedown', (event) => {
			this.#uiContainer.style.pointerEvents = 'none'
			const clickTargetX = event.clientX
			const clickTargetWidth = this.#uiContainer.clientWidth

			const handleMouseMove = ({ clientX }: MouseEvent) => {
				this.#uiContainer.style.width = `${
					clickTargetWidth - (clientX - clickTargetX)
				}px`
			}

			const handleMouseUp = () => {
				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('mouseup', handleMouseUp)
				this.#uiContainer.style.pointerEvents = ''
			}

			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
		})
	}

	/**
	 * Check if the id is active
	 * @param id ID of the binding
	 * @returns True if the id is active
	 */
	#isActive(id: string): boolean {
		return document.querySelectorAll(`.${id}`).length > 1
	}

	/**
	 * Set the reset button on the panels bindings
	 */
	#setResetButton() {
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
			this.#handleLocalSave(id, state)
		const handleUnsave = (id: string) => this.#handleLocalUnsave(id)
		const getDefaultState = (id: string) => this.#handleLocalValue(id)
		const isActive = (id: string) => this.#isActive(id)
		const getStackId = async (state: BladeState, element: HTMLElement) => {
			return await this.#getStackID(state, element)
		}
		const controlsChange = (add: boolean, id?: string) => {
			this.#controlsChange(add, id)
		}

		this.#pool.createBindingApi = (function (original) {
			return function (bc) {
				controlsChange(true)
				const valueElement = bc.view.valueElement
				valueElement.style.position = 'relative'
				valueElement.style.paddingRight = '20px'
				const clonedResetButton = resetButton.cloneNode(true) as HTMLElement
				valueElement.appendChild(clonedResetButton)

				window.requestAnimationFrame(() => {
					const initial = { state: copyObject(bc.exportState()) }

					// Wait the panel to build element
					const element = bc.view.element
					getStackId(initial.state, element).then((id) => {
						if (!id) return controlsChange(false)
						element.id = id
						element.classList.add(id)

						if (isActive(id)) {
							console.warn(
								`The debug "${initial.state?.title}" is already used in the session storage`,
								bc
							)
						}

						/**
						 * Handle reset button color
						 * @param value Value of the binding
						 */
						const handleResetButton = (value: any) => {
							const binding = initial.state?.binding as any

							if (JSON.stringify(value) === JSON.stringify(binding?.value)) {
								clonedResetButton.style.color = '#65656e'
							} else {
								clonedResetButton.style.color = 'var(--btn-bg-a)'
							}
						}

						// Default state
						const defaultState = getDefaultState(id)
						if (defaultState) {
							bc.importState(defaultState)
							handleSave(id, bc.exportState())
							handleResetButton(defaultState.binding.value)
						}

						// Handle changes
						bc.value.emitter.on('change', (e) => {
							handleSave(id, bc.exportState())
							handleResetButton(e.rawValue)
						})

						// Trigger onLoad if needed
						const binding = (bc.valueController.value as any).binding
						const onLoad = binding?.target?.obj_?.onLoad
						if (onLoad && typeof onLoad === 'function') onLoad()

						// Add the control to the ready controls
						controlsChange(true, id)

						// Click event
						clonedResetButton.addEventListener('click', () => {
							initial.state && bc.importState(initial.state)
							handleUnsave(id)
						})
					})
				})

				// @ts-ignore
				return original.apply(this, arguments)
			}
		})(this.#pool.createBindingApi)
	}

	/**
	 * Handle local save
	 * @param id ID of the binding
	 * @param state State of the binding
	 */
	#handleLocalSave(id: string, state: any) {
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
	 * Handle local unsave
	 * @param id ID of the binding
	 */
	#handleLocalUnsave(id: string) {
		const current = sessionStorage.getItem('debugParams')
		if (!current) return

		if (id) {
			const values = JSON.parse(current)
			delete values[id]
			sessionStorage.setItem('debugParams', JSON.stringify(values))
		} else {
			console.warn('Id is not defined')
		}
	}

	/**
	 * Handle default local value
	 * @param id ID of the binding
	 * @returns Default local value
	 */
	#handleLocalValue(id: string): any {
		const current = sessionStorage.getItem('debugParams')
		if (!current) return

		const values = JSON.parse(current)
		const res = values[id]

		if (defined(res?.disabled)) {
			res.disabled = false
		}

		if (id) return res
	}

	/**
	 * Set the debug manager
	 */
	#setDebugManager() {
		const debugManager = this.panel.addFolder({
			title: 'Debug Feature Manager',
			expanded: false,
		})

		const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof TDebugParams>
		keys.forEach((key) =>
			debugManager.addBinding(this.debugParams, key).on('change', () => {
				if (this.loading) return

				switch (key) {
					case 'Stats':
						if (this.debugParams.Stats) {
							this.stats?.enable()
							this.#monitoring.style.display = 'flex'
						} else {
							this.stats?.disable()
							this.#monitoring.style.display = 'none'
						}
					case 'LoadingScreen':
						const loadingScreen = this.debugParams.LoadingScreen
						this.#experience.store.loadingScreen = loadingScreen
					case 'Landing':
						const landing = this.debugParams.Landing
						this.#experience.store.landing = landing
						this.#experience.start()
				}
			})
		)
	}

	/**
	 * Set the stats panel
	 */
	#setStats() {
		this.stats = new Stats(this.debugParams.Stats)
	}

	/**
	 * Set the monitoring panel
	 */
	#setMonitoring() {
		const monitoringValues: Array<TMonitoringValue> = [
			{
				name: 'Calls',
				value: () => this.#experience.renderer.instance.info.render.calls,
			},
			{
				name: 'Triangles',
				value: () => this.#experience.renderer.instance.info.render.triangles,
			},
			{
				name: 'Lines',
				value: () => this.#experience.renderer.instance.info.render.lines,
			},
			{
				name: 'Points',
				value: () => this.#experience.renderer.instance.info.render.points,
			},
			{
				name: 'Geometries',
				value: () => this.#experience.renderer.instance.info.memory.geometries,
			},
			{
				name: 'Materials',
				value: () => this.#experience.renderer.instance.info.programs?.length,
			},
			{
				name: 'Textures',
				value: () => this.#experience.renderer.instance.info.memory.textures,
			},
		]

		this.#monitoring = document.createElement('section')
		Object.assign(this.#monitoring.style, {
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
			this.#monitoring.appendChild(monitoringValueElement)
		})

		document.body.appendChild(this.#monitoring)

		this.#statsValues = {
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
