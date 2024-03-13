import { defaultPathOptions } from './constants'
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
			let matched = columns.find((column) => column.name === col.name.replace(currencySuffix, ''))
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
