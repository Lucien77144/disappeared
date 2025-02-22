import type { TResourcesStore } from '~/models/stores/resources.store.model'
import type { TStore } from '~/models/stores/store.model'

type TParam<T extends keyof TResourcesStore> = TResourcesStore[T]

export const useResourcesStore = defineStore('resources', {
	state: (): TStore<TResourcesStore> => ({
		$items: {},
	}),
	getters: {
		items(): TResourcesStore['items'] {
			return this.$items
		},
	},
	actions: {
		setItems(val: TParam<'items'>) {
			this.$items = val
		},
	},
})
