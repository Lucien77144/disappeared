import type { Dictionary } from '../functions/dictionary.model'
import type { TResourceData } from '../utils/Resources.model'

export type TResourcesStore = {
	items: Dictionary<TResourceData>
}
