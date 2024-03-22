import { getDeepScanSample } from './infer'
import { getType } from './utils'
import { identity } from 'ramda'

export function model(options = {}) {
	const { scanDeep } = options
	let data = []

	const fns = {
		get: () => data,
		useDeepScan: () => model({ ...options, scanDeep: true }),
		renameUsing: (rename = identity) => {
			if (rename !== identity) {
				data = data.map((x) => ({ ...x, name: rename(x.name) }))
			}
			return fns
		},
		/**
		 * Analyzes the input data and derives a model from it
		 *
		 * @param {Array|Object} value - the data to derive the model from
		 * @returns {Object}     this
		 */
		from: (value) => {
			data = deriveModel(value, scanDeep)
			return fns
		},
		/**
		 * Merges the model with another model
		 *
		 * @param {Array}   other    - the model to merge with
		 * @param {Boolean} override - whether to override the type of the first model
		 * @returns {Object} this
		 */
		merge: (other, override = false) => {
			data = mergeModels(data, other.get(), override)
			return fns
		}
	}
	return fns
}

/**
 * Derives a model from the input data
 *
 * @param {Array|Object} value  - the data to derive the model from
 * @param {Boolean}      sparse - whether the data set contains sparse data
 * @returns {Array}             - the derived model
 */
function deriveModel(value, sparse = false) {
	const data = []
	let item = value

	if (Array.isArray(value)) item = sparse ? getDeepScanSample(value) : value[0]

	const kv = Object.entries(item)
	kv.forEach(([key, value]) => {
		data.push({ name: key, type: getType(value) })
	})
	return data
}

/**
 * Merges two models, returning a new model
 *
 * @param {Array} first      - the first model
 * @param {Array} second     - the second model
 * @param {Boolean} override - whether to override the type of the first model
 * @returns {Array}      - the merged model
 */
function mergeModels(first, second, override = false) {
	second.forEach(({ name, type }) => {
		const existing = first.find((x) => x.name === name)
		if (existing) {
			if (existing.type !== type) existing.mixedTypes = true
			if (override) existing.type = type
		} else {
			first.push({ name, type })
		}
	})
	return first
}
