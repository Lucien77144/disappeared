import {
	isDeviceMobile,
	isDeviceMobileOrTablet,
} from '~/utils/functions/device'
import { breakpoint, breakpoints } from '~/utils/functions/breakpoints'
import dpr from '~/utils/functions/dpr'
import isTouch from '~/utils/functions/isTouch'
import EventEmitter from './EventEmitter'
import { Vector2 } from 'three'

export type TViewportEvents = {
	resize: () => void
}

export default class Viewport extends EventEmitter<TViewportEvents> {
	// Singleton
	static instance: Viewport

	// Public
	public enableBus!: boolean
	public debug!: boolean
	public isTouch!: boolean
	public isMobile!: boolean
	public isTablet!: boolean
	public isDesktop!: boolean
	public breakpoint!: string
	public interval!: number
	public rem!: number
	public width!: number
	public height!: number
	public ratio!: number
	public dpr!: number

	// Private
	#handleResize: any
	#ratioVec2!: Vector2

	// Nuxt
	private $bus: any
	private $router: any

	/**
	 * Constructor
	 * @param options Options
	 * @param options.enableBus Enable the bus (default: false)
	 */
	constructor(options?: { enableBus?: boolean }) {
		super()

		if (!window) return
		if (Viewport.instance) {
			return Viewport.instance
		}
		Viewport.instance = this

		// Public
		this.enableBus = !!options?.enableBus

		// Private
		this.#ratioVec2 = new Vector2()
		this.#handleResize = this.resize.bind(this)
		window.addEventListener('resize', this.#handleResize, false)

		// Nuxt
		this.$bus = useNuxtApp().$bus
		this.$router = useNuxtApp().$router

		// Init
		this.#setData()
	}

	/**
	 * Get the ratio as a vector2 of the current viewport
	 */
	public get ratioVec2(): Vector2 {
		return this.getRatioVec2(this.width, this.height)
	}

	/**
	 * Get the ratio as a vector2
	 * @param width Width
	 * @param height Height
	 */
	public getRatioVec2(width: number, height: number): Vector2 {
		const x = width / height
		const y = height / width

		const isHorizontal = x > y
		return new Vector2(!isHorizontal ? 1 : x, isHorizontal ? 1 : y)
	}

	/**
	 * Set data of the viewport
	 */
	#setData(): void {
		this.debug = this.$router.currentRoute.value.href.includes('debug')
		this.width = document.documentElement.clientWidth
		this.height = document.documentElement.clientHeight
		this.ratio = this.width / this.height
		this.dpr = dpr()
		this.isTouch = isTouch()
		this.isMobile = isDeviceMobile()
		this.isTablet = !isDeviceMobile() && isDeviceMobileOrTablet()
		this.isDesktop = !isDeviceMobile() && !isDeviceMobileOrTablet()
		this.breakpoint = breakpoint(this.width)
		this.interval = breakpoints[this.breakpoint]
		this.rem = (window.innerWidth / breakpoints[this.breakpoint]) * 10
	}

	/**
	 * Resize
	 */
	public resize(): void {
		this.#setData()
		this.trigger('resize')
		if (this.enableBus) this.$bus.emit('resize')
	}

	/**
	 * Dispose
	 */
	public dispose(): void {
		// Dispose events
		this.disposeEvents()

		// Remove event listener
		window.removeEventListener('resize', this.#handleResize)
	}
}
