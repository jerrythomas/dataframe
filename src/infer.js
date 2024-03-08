import { ascending, descending } from 'd3-array'
import { counter } from './aggregators'
import { createFormatter } from './formatter'
import { defaultViewOptions, defaultActionOrder } from './constants'

/**
 * Check if a value is a date string
 * @param {string} value
 * @returns {boolean}
 */
function isDateString(value) {
	return !isNaN(Date.parse(value))
}

/**
 * Derive the type of a value
 * @param {any} value
 * @returns {string}
 */
function getType(value) {
	let type = Array.isArray(value) ? 'array' : typeof value
	return type === 'string' && isDateString(value) ? 'date' : type
}
/**
 *
 * @param  {...[string|[string, boolean]]} cols
 * @returns {Array<{import('./types.js').ColumnSorter}}>}
 */
export function deriveSortableColumns(...cols) {
	return cols.map((value) => {
		if (Array.isArray(value)) {
			return { column: value[0], sorter: value[1] ? ascending : descending }
		}
		return { column: value, sorter: ascending }
	})
}

/**
 * Derive an array of column aggregators from a list of aggregation names
 *
 * @param  {...[string|[string, function, string]]} cols
 * @returns {Array<{import('./types.js').ColumnAggregator}}>}
 */
export function deriveAggregators(...cols) {
	return cols.map((name) => {
		if (Array.isArray(name)) {
			return { column: name[0], aggregator: name[1], suffix: name[2] || '' }
		}
		return {
			column: name,
			aggregator: counter,
			suffix: 'count'
		}
	})
}

/**
 * Derives a unique list of column names from an array of data objects.
 * Each data object represents a row and this function compiles a list of all unique property keys
 * present across these objects.
 *
 * @param {Object[]} data - The array of data objects to analyze for column names.
 * @returns {string[]} - An array of strings representing the unique column names found across all data objects.
 */
export function deriveColumns(data, full = false) {
	if (data.length === 0) return []
	if (!full) Object.keys(data[0])
	return Array.from(data.map((row) => Object.keys(row)).reduce((p, n) => new Set([...p, ...n])))
}

/**
 * Derives the data types of columns based on the data provided in an array of objects.
 * The function assumes that all values of a single field (column) are of the same type. It uses
 * the first object in the data array as a reference for the field names. Each field is categorized
 * as either 'string' or 'number' based on whether any of the field values in the data set are non-numeric.
 *
 * @param {Object[]} data - The array of data objects to assess for column data types.
 * @returns {Object} - An object with keys being the data types ('string' & 'number') and values
 *                     being arrays of field names that correspond to that data type.
 */
export function deriveDataTypes(data) {
	let dataTypes = Object.keys(data[0])
		.map((field) => ({
			field,
			type: data.map((d) => d[field]).some(isNaN) ? 'string' : 'number'
		}))
		.reduce((acc, cur) => ({ ...acc, [cur.type]: [...acc[cur.type], cur.field] }), {
			string: [],
			number: []
		})
	return dataTypes
}

/**
 * Infers the data type of a set of values by examining the values in the array.
 * Assumes all values in the array should have the same type, unless they are 'null'.
 * If multiple types are detected (excluding 'null'), the function will return 'mixed'.
 * If all values are 'null', it returns 'null', and it returns 'undefined' for an empty array.
 *
 * @param {Array} values - An array of values for which the data type is to be inferred.
 * @returns {string} - A string representing the inferred data type. Possible values are
 *                     'undefined', 'null', 'mixed', or any data type returned by the getType function.
 */
export function inferDataType(values) {
	if (values.length === 0) {
		return 'undefined'
	}

	const nonNullValues = values.filter((value) => value !== null)

	if (nonNullValues.length === 0) {
		return 'null'
	}

	let type = getType(nonNullValues[0])

	for (let i = 1; i < nonNullValues.length; i++) {
		if (getType(nonNullValues[i]) !== type) {
			type = 'mixed'
			break
		}
	}

	return type
}

/**
 * Derives column metadata from the data to be used in a tabular component.
 *
 * @param {Array} data - The data to derive column metadata from.
 * @returns {Array<import('./types').ColumnMetadata>} - The derived column metadata.
 */
export function deriveColumnMetadata(dataArray, options = {}) {
	if (dataArray.length === 0) return []

	const { path, separator, actions, language } = { ...defaultViewOptions, ...options }
	const firstRow = dataArray[0]

	let columns = []

	for (const key in firstRow) {
		const dataType = getType(firstRow[key])
		const formatter = createFormatter(dataType, language)
		const fields = { text: key }

		if (key.endsWith('_currency')) {
			deriveCurrencyAttribute(key, columns, language)
		} else {
			columns.push({
				name: key,
				dataType: dataType,
				fields,
				formatter
			})
		}
	}
	if (path) addPathAttribute(columns, path, separator)
	if (actions.length > 0) columns = deriveActions(columns, actions)

	return columns
}

/**
 * Adds a currency attribute to the column metadata. This function updates the columns array in place.
 *
 * @param {string} key                                      - The key of the currency column.
 * @param {Array<import('./types').ColumnMetadata>} columns - The column metadata to update.
 * @param {string} language                                 - The language to use for formatting the currency.
 */
function deriveCurrencyAttribute(key, columns, language) {
	const currencyColumn = key
	const baseColumn = key.replace(/_currency$/, '')

	// Find the existing column and update its currency attribute
	const existingColumn = columns.find((column) => column.name === baseColumn)
	existingColumn.dataType = 'currency'
	existingColumn.formatter = createFormatter('currency', language, 2)
	if (existingColumn) {
		existingColumn.fields = {
			...existingColumn.fields,
			currency: currencyColumn
		}
	}
}

/**
 * Converts an array of action names to an array of action objects.
 *
 * @param {Array<string|import('./types').Action>} input - The input to convert to actions.
 * @returns {Array<import('./types').Action>} - The converted actions.
 */
export function convertToActions(input) {
	if (Array.isArray(input)) {
		const actions = input
			.map((action) => {
				if (typeof action === 'string') {
					return { name: action, label: action, order: defaultActionOrder[action] }
				}
				return { order: defaultActionOrder[action.name], ...action }
			})
			.sort((a, b) => a.order - b.order)
		return actions
	}
}
/**
 * Adds actions to the column metadata. This function updates the columns array in place.
 *
 * @param {Array<import('./types').ColumnMetadata>} columns - The column metadata to update.
 * @param {Array<string|import('./types').Action>}  input   - The actions to add to the column metadata.
 * @returns {Array<import('./types').ColumnMetadata>} - The updated column metadata.
 */
export function deriveActions(columns, input) {
	// convert array of strings to array of objects
	const actions = convertToActions(input)
	const existing = columns.filter(({ action }) => action).map(({ action }) => action)

	const actionColumns = actions
		.filter(({ name }) => !existing.includes(name))
		.map(({ name, label }) => ({
			label,
			action: name
		}))
	return [...actionColumns, ...columns]
}

/**
 * Adds a hierarchical path column to the column metadata
 *
 * @param {Array<import('./types').ColumnMetadata>} columns - The column metadata to update.
 * @param {string} path - The column name to be used as hierarchical path.
 * @param {string} separator - The separator to be used in the path.
 * @returns {Array<import('./types').ColumnMetadata>} - The updated column metadata.
 */
export function addPathAttribute(columns, path, separator) {
	let pathColumn = columns.find(({ name }) => name === path)

	if (pathColumn) {
		pathColumn.path = true
		pathColumn.separator = separator
	}
	return columns
}

/**
 * Derives the hierarchy from the data.
 *
 * @param {Array} data - The data to derive the hierarchy from.
 * @param {string} path - The column name to be used as hierarchical path.
 * @param {string} separator - The separator to be used in the path.
 * @returns {Array<import('./types').Hierarchy>} - The derived hierarchy.
 */
export function deriveHierarchy(data, options) {
	const { expanded, path, separator } = { ...defaultViewOptions, ...options }
	if (!path) return data.map((row) => ({ depth: 0, row }))

	let hierarchy = data.map((row) => {
		const parts = row[path].split(separator).filter((part) => part.length > 0)
		const depth = parts.length - 1
		const value = parts[depth]
		return { depth, value, path: row[path], row }
	})

	hierarchy.map((row) => {
		row.children = hierarchy.filter(
			(child) => child.path.startsWith(row.path) && row.depth === child.depth - 1
		)

		row.isParent = row.children.length > 0
		row.children.map((child) => {
			child.parent = row
		})
		if (row.isParent) row.isExpanded = expanded
	})
	return hierarchy
}
