import { identity } from 'ramda'
import { defaultPathOptions } from './constants'
import { getDeepScanSample } from './infer'
import { getType } from './utils'

/**
 * Merges currency-related attributes into the corresponding base columns.
 *
 * @param {Array<Object>} input - An array of column definitions.
 * @param {string} currencySuffix - The suffix used to identify currency columns.
 * @returns {Array<Object>} A new array of merged column definitions.
 */
function mergeCurrencyAttributes(input, currencySuffix) {
	let currencyColumns = input.filter((col) => col.name.endsWith(currencySuffix))
	const columns = input.filter((col) => !col.name.endsWith(currencySuffix))

	currencyColumns = currencyColumns
		.map((col) => {
			const matched = columns.find((column) => column.name === col.name.replace(currencySuffix, ''))
			if (matched) {
				matched.fields.currency = col.name
				matched.type = 'currency'
				matched.digits = 2
				return null
			}
			return col
		})
		.filter((col) => col !== null)

	return [...columns, ...currencyColumns]
}

/**
 * Adds a path modifier to column definitions that match a specific path.
 *
 * @param {Array<Object>} columns - The original array of column definitions.
 * @param {string|null} path - The path used to identify columns that require path modifiers.
 * @param {string} separator - The separator used in conjunction with the path.
 * @returns {Array<Object>} The array of column definitions with path modifiers added as needed.
 */
export function addPathModifier(columns, path, separator) {
	if (!path) return columns

	const index = columns.findIndex((col) => col.name === path)
	if (index > -1) {
		return [
			{ ...columns[index], path: true, separator },
			...columns.slice(0, index),
			...columns.slice(index + 1)
		]
	}
	return columns
}

/**
 * Derives column properties for a given sample and options.
 *
 * @param {Object} sample - The sample object used to derive column properties.
 * @param {Object} options - The options used to modify column properties.
 *        It can specify path, separator, and currencySuffix for column customization.
 * @returns {Array<Object>} An array of derived column definitions.
 */
export function deriveColumnProperties(sample, options) {
	const { path, separator, currencySuffix } = { ...defaultPathOptions, ...options }

	let columns = Object.keys(sample).map((key) => ({
		name: key,
		type: getType(sample[key]),
		sortable: true,
		filterable: true,
		sorted: 'none',
		fields: { text: key }
	}))

	columns = addPathModifier(columns, path, separator)
	return mergeCurrencyAttributes(columns, currencySuffix)
}

/**
 * Combines two arrays of metadata into a single array.
 *
 * @param {import('./types).Metadata} first  - The first array of metadata.
 * @param {import('./types).Metadata} second - The second array of metadata.
 *
 * @returns {import('./types').Metadata} The combined array of metadata.
 */
export function combineMetadata(first, second, overwrite = false) {
	const metadata = [...first]
	second.forEach(({ name, type }) => {
		const existing = metadata.find((x) => x.name === name)
		if (existing) {
			if (overwrite) {
				existing.type = type
			} else if (existing.type !== type) {
				throw new Error(`Metadata conflict: ${name} has conflicting types`)
			}
		} else {
			metadata.push({ name, type })
		}
	})
	return metadata
}

/**
 * Derives the column metadata from the provided data and options.
 *
 * @param {Array} data                       - The data to derive the column metadata from.
 * @param {Object} [options]                 - Optional parameters to control the metadata derivation.
 * @param {Array} [options.metadata]         - The metadata to use instead of deriving it from the data.
 * @param {boolean} [options.deepScan=false] - Determines if the metadata derivation should perform a deep scan of the data.
 *
 * @returns {import('./types').Metadata} The derived column metadata.
 */
export function deriveColumnMetadata(data, options = {}) {
	const { metadata, deepScan = false } = options
	if (Array.isArray(metadata) && metadata.length > 0) return metadata
	if (data.length === 0) return []
	const sample = deepScan ? getDeepScanSample(data) : data[0]
	return Object.entries(sample).map(([name, value]) => ({ name, type: getType(value) }))
}

/**
 * Derive column index from metadata.
 * @param {Array} metadata - The metadata array.
 * @returns {Object} - The column index object.
 */
export function deriveColumnIndex(metadata) {
	return metadata.reduce((acc, col, index) => {
		acc[col.name] = index
		return acc
	}, {})
}

/**
 * Creates metadata for aggregated data based on original metadata and group by keys.
 *
 * @param {Array} data        - The aggregated data array.
 * @param {Array} oldMetadata - Original metadata.
 * @param {Array} groupByKeys - The keys used for grouping.
 * @param {Array} summaries   - The summaries to include in the metadata.
 * @returns {Array} An array of updated metadata objects.
 */
export function buildMetadata(data, oldMetadata, groupByKeys, summaries) {
	const metadata = oldMetadata.filter((col) => groupByKeys.includes(col.name))
	summaries.forEach(({ reducers }) => {
		reducers.forEach(({ field }) => {
			const type = getType(data[0][field])
			if (type === 'array') {
				metadata.push({ name: field, type, metadata: deriveColumnMetadata(data[0][field]) })
			} else {
				metadata.push({ name: field, type })
			}
		})
	})
	return metadata
}

/**
 * Generates a renamer function which adds a prefix or suffix to a string.
 *
 * @param {OptionsToRenameKeys} options - Options to rename keys
 * @returns {Function} - A function that takes a string and adds a prefix or suffix.
 */
export function getAttributeRenamer(options) {
	const { prefix, suffix, separator = '_' } = options
	let rename = identity
	if (prefix) {
		rename = (x) => [prefix, x].join(separator)
	} else if (suffix) {
		rename = (x) => [x, suffix].join(separator)
	}
	return rename
}
