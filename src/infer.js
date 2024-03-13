import { ascending, descending } from 'd3-array'
import { counter } from './aggregators'
import { createFormatter } from './formatter'
import { defaultViewOptions, defaultActionOrder } from './constants'
import { compact } from './string'
import { omit } from 'ramda'
import { getType } from './utils'
import { deriveColumnProperties } from './metadata'

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

function getDeepScanSample(data) {
	return data.reduce(
		(acc, cur) => ({
			...acc,
			...compact(omit(Object.keys(acc), cur))
		}),
		{}
	)
}
/**
 * Derives a unique list of column names from an array of data objects.
 * Each data object represents a row and this function compiles a list of all unique property keys
 * present across these objects.
 *
 * @param {Object[]} data - The array of data objects to analyze for column names.
 * @returns {string[]} - An array of strings representing the unique column names found across all data objects.
 */
export function deriveColumns(data, options) {
	if (data.length === 0) return []

	const { scanMode } = { ...defaultViewOptions, ...options }
	const sample = scanMode === 'fast' ? data[0] : getDeepScanSample(data)

	return deriveColumnProperties(sample, options)
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
	const dataTypes = Object.keys(data[0])
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
export function deriveMetadata(dataArray, options = {}) {
	let { columns = [] } = options
	if (dataArray.length === 0) return columns
	const { actions, language } = { ...defaultViewOptions, ...options }

	if (columns.length === 0) columns = deriveColumns(dataArray, options)
	columns = addFormatters(columns, language)
	// if (path) addPathAttribute(columns, path, separator)
	if (actions.length > 0) columns = deriveActions(columns, actions)

	return columns
}

/**
 * Adds a formatter function to each column in the array based on the column type. If a formatter
 * function is already present, it will not be overwritten. The formatter is created based on the
 * override formatter if present, or the column type and language.
 *
 * @param {Array<import('./types').ColumnMetadata>} columns - The array of column metadata to add formatters to.
 * @param {string} language - The language to use for formatting.
 * @returns {Array<import('./types').ColumnMetadata>} - The array of column metadata with formatters added.
 */
export function addFormatters(columns, language) {
	return columns.map((column) => {
		const formatter = column.formatter ?? column.type
		if (typeof formatter !== 'function') {
			const digits = column.digits ?? (['number', 'currency'].includes(column.type) ? 2 : 0)
			column.formatter = createFormatter(formatter, language, digits)
		}
		return column
	})
}

/**
 * Converts an array of action names to an array of action objects.
 *
 * @param {Array<string|import('./types').Action>} input - The input to convert to actions.
 * @returns {Array<import('./types').Action>} - The converted actions.
 */
export function convertToActions(input) {
	if (!Array.isArray(input)) return []
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
