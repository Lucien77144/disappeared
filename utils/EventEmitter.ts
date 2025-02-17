import type { ArgumentTypes } from '~/models/functions/argumentTypes.model'
import { defined } from './functions/defined'

// Events list type
type TEventsList<T extends string> = Record<T, (...args: any[]) => any>

// Event name type, returning type string name
type TEventName<
	K extends TEventsList<keyof K extends string ? keyof K : never>
> = keyof K

// Event callback type
type TEventCallback<
	T extends TEventName<K>,
	K extends TEventsList<keyof K extends string ? keyof K : never>
> = (...args: ArgumentTypes<K[T]>) => ReturnType<K[T]>

export default class EventEmitter<
	K extends TEventsList<string> = TEventsList<string>
> {
	// Public
	public callbacks: {
		[key in TEventName<K>]?: TEventCallback<key, K>[]
	}

	/**
	 * Constructor
	 */
	constructor() {
		// Public
		this.callbacks = {}
	}

	/**
	 * Set callback for an event
	 * @param name Event name
	 * @param callback Callback
	 */
	public on<T extends TEventName<K>>(
		name: T,
		callback: TEventCallback<T, K>
	): this {
		// Resolve name
		this.callbacks[name] ??= []
		this.callbacks[name].push(callback)

		return this
	}

	/**
	 * Off event
	 * @param names Event names
	 */
	public off(names: TEventName<K> | TEventName<K>[]): this {
		const keys = Array.isArray(names) ? names : [names]

		// Each name
		keys.forEach((key) => delete this.callbacks[key])

		return this
	}

	/**
	 * Off all events
	 */
	public disposeEvents(): void {
		// Dispose all events
		Object.keys(this.callbacks).forEach((key) => this.off(key))
	}

	/**
	 * Trigger event
	 * @param name Event names
	 * @param args Event arguments
	 */
	public trigger<T extends TEventName<K>>(
		name: T,
		args?: ArgumentTypes<K[T]>[number]
	): this | ReturnType<TEventCallback<T, K>> {
		// Check if the event exists
		if (!this.callbacks[name]) {
			return this
		}
		// Default args
		const argsArray = !Array.isArray(args) ? [args] : args
		args = argsArray as ArgumentTypes<K[keyof K]>

		// Default namespace
		let result: ReturnType<TEventCallback<T, K>> | undefined
		this.callbacks[name]?.forEach((callback: TEventCallback<T, K>) => {
			result = callback.apply(this, args)
		})

		return defined(result) ? (result as ReturnType<TEventCallback<T, K>>) : this
	}
}
