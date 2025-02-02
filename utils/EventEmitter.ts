import type { ArgumentTypes } from '~/models/functions/argumentTypes.model'

// Events list type
type TEventsList<T extends string> = Record<T, any>

// Event name type, returning type string name
type TEventName<
	K extends TEventsList<keyof K extends string ? keyof K : never>
> = keyof K
type TEventNames<
	K extends TEventsList<keyof K extends string ? keyof K : never>
> = TEventName<K> | TEventName<K>[]

// Event callback type
type TEventCallback<
	T extends TEventName<K>,
	K extends TEventsList<keyof K extends string ? keyof K : never>
> = (...args: ArgumentTypes<K[T]>) => ReturnType<K[T]>

export default class EventEmitter<
	K extends TEventsList<string> = TEventsList<string>
> {
	// Public
	public callbacks: any

	/**
	 * Constructor
	 */
	constructor() {
		// Public
		this.callbacks = {
			all: {},
			base: {},
		}
	}

	/**
	 * Set callback for an event
	 * @param _names Event names
	 * @param callback Callback
	 */
	public on<T extends TEventName<K>>(
		_names: T,
		callback: TEventCallback<T, K>
	): this {
		// Resolve names
		const names = this._resolveNames(_names)

		// Each name
		names.forEach((_name) => {
			// Resolve name
			const name = this._resolveName(_name)
			this.callbacks.all[name.value] = callback

			// Create namespace if not exist
			if (!(this.callbacks[name.namespace] instanceof Object)) {
				this.callbacks[name.namespace] = {}
			}

			// Create callback if not exist
			if (!(this.callbacks[name.namespace][name.value] instanceof Array)) {
				this.callbacks[name.namespace][name.value] = []
			}

			// Add callback
			this.callbacks[name.namespace][name.value].push(callback)
		})

		return this
	}

	/**
	 * Off event
	 * @param _names Event names
	 */
	public off(_names: TEventNames<K>): this {
		// Resolve names
		const names = this._resolveNames(_names)

		// Each name
		names.forEach((_name) => {
			// Resolve name
			const name = this._resolveName(_name)
			delete this.callbacks.all[name.value]

			// Remove namespace
			if (name.namespace !== 'base' && name.value === '') {
				delete this.callbacks[name.namespace]
			}

			// Remove specific callback in namespace
			else {
				// Default
				if (name.namespace === 'base') {
					// Try to remove from each namespace
					for (const namespace in this.callbacks) {
						if (
							this.callbacks[namespace] instanceof Object &&
							this.callbacks[namespace][name.value] instanceof Array
						) {
							delete this.callbacks[namespace][name.value]

							// Remove namespace if empty
							if (Object.keys(this.callbacks[namespace]).length === 0)
								delete this.callbacks[namespace]
						}
					}
				}

				// Specified namespace
				else if (
					this.callbacks[name.namespace] instanceof Object &&
					this.callbacks[name.namespace][name.value] instanceof Array
				) {
					delete this.callbacks[name.namespace][name.value]

					// Remove namespace if empty
					if (Object.keys(this.callbacks[name.namespace]).length === 0)
						delete this.callbacks[name.namespace]
				}
			}
		})

		return this
	}

	/**
	 * Off all events
	 */
	public disposeEvents(): void {
		Object.keys(this.callbacks.all).forEach((key) =>
			this.off(key as TEventNames<K>)
		)
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
		let finalResult: ReturnType<TEventCallback<T, K>> | undefined

		// Default args
		const argsArray = !(_args instanceof Array) ? [_args] : _args
		const args = argsArray as ArgumentTypes<K[keyof K]>

		// Resolve names (should on have one event)
		let name = this._resolveName(this._resolveNames(_name)[0])

		// Default namespace
		if (name.namespace === 'base') {
			// Try to find callback in each namespace
			for (const namespace in this.callbacks) {
				if (
					this.callbacks[namespace] instanceof Object &&
					this.callbacks[namespace][name.value] instanceof Array
				) {
					this.callbacks[namespace][name.value].forEach(
						(callback: TEventCallback<T, K>) => {
							const result = callback.apply(this, args)
							if (typeof finalResult === 'undefined') {
								finalResult = result
							}
						}
					)
				}
			}
		}
		// Specified namespace
		else if (this.callbacks[name.namespace] instanceof Object) {
			if (name.value === '') {
				console.warn('wrong name')
				return this
			}

			this.callbacks[name.namespace][name.value].forEach(
				(callback: TEventCallback<T, K>) => {
					const result = callback.apply(this, args)
					if (typeof finalResult === 'undefined') finalResult = result
				}
			)
		}

		return finalResult !== undefined ? finalResult : this
	}

	/**
	 * Resolve multiple names and return an array of names
	 * @param _names Event names
	 */
	private _resolveNames(_names: TEventNames<K>): Array<string> {
		const names = Array.isArray(_names) ? _names.join(' ') : _names.toString()
		const sanitizedNames = names
			.replace(/[^a-zA-Z0-9 ,/.]/g, '')
			.replace(/[,/]+/g, ' ')

		return sanitizedNames.split(' ')
	}

	/**
	 * Resolve name and return an object with original, value and namespace
	 * @param name Event name
	 */
	private _resolveName(name: string) {
		const parts = name.split('.')
		const newName = {
			original: name,
			value: parts[0] as TEventName<K>,
			namespace: 'base', // Base namespace
		}

		// Specified namespace
		if (parts.length > 1 && parts[1] !== '') {
			newName.namespace = parts[1]
		}

		return newName
	}
}
