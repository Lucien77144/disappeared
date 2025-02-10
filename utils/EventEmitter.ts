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
	 * @param _names Event names
	 * @param callback Callback
	 */
	public on<T extends TEventName<K>>(
		_name: T,
		callback: TEventCallback<T, K>
	): this {
		// Resolve name
		this.callbacks[_name] ??= []
		this.callbacks[_name].push(callback)

		return this
	}

	/**
	 * Off event
	 * @param _names Event names
	 */
	public off(_names: TEventName<K> | TEventName<K>[]): this {
		const names = Array.isArray(_names) ? _names : [_names]

		// Each name
		names.forEach((_name) => {
			delete this.callbacks[_name]
		})

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
	 * @param _name Event names
	 * @param _args Event arguments
	 */
	public trigger<T extends TEventName<K>>(
		_name: T,
		_args?: ArgumentTypes<K[T]>[number]
	): this | ReturnType<TEventCallback<T, K>> {
		// Check if the event exists
		if (!this.callbacks[_name]) {
			return this
		}
		// Default args
		const argsArray = !Array.isArray(_args) ? [_args] : _args
		const args = argsArray as ArgumentTypes<K[keyof K]>

		// Default namespace
		let result: ReturnType<TEventCallback<T, K>> | undefined
		this.callbacks[_name]?.forEach((callback: TEventCallback<T, K>) => {
			result = callback.apply(this, args)
		})

		return defined(result) ? (result as ReturnType<TEventCallback<T, K>>) : this
	}
}
