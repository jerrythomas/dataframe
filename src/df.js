import { deriveSortableColumn } from './infer'
import { getType } from './utils'
import { join } from './join'
import { pick, equals } from 'ramda'
import { groupBy } from './summary'

/**
 * Check if an object is a DataFrame.
 * @param {any} obj - The object to check.
 * @returns {boolean} True if the object is a DataFrame, false otherwise.
 */
export function isDataFrame(obj) {
	if (obj === null || typeof obj !== 'object') return false
	const attributes = Object.entries(obj).reduce(
		(cur, [key, value]) => ({ ...cur, [key]: getType(value) }),
		{}
	)
	return equals(attributes, {
		data: 'array',
		metadata: 'array',
		columns: 'object',
		sortBy: 'function',
		groupBy: 'function',
		where: 'function',
		join: 'function',
		select: 'function'
	})
}

/**
 * Sorts the DataFrame by the specified columns.
 *
 * @param {Object} df                                    - The DataFrame-like object to sort.
 * @param {...{import('./types').SortableColumn} columns - The columns to sort by.
 *
 * @returns {Object}  The sorted DataFrame-like object.
 */
function sortBy(df, ...columns) {
	const sorters = columns.map(deriveSortableColumn)

	df.data.sort((a, b) => {
		let result = 0
		for (let i = 0; i < sorters.length && result === 0; i++) {
			const { name, sorter } = sorters[i]
			result = sorter(a[name], b[name])
		}
		return result
	})
	return df // returning the original DataFrame-like object
}

/**
 * Groups the DataFrame by the specified columns.
 * @param {Object} df - The DataFrame-like object to group.
 * @param {...string} columns - The columns to group by.
 * @returns {Object} The grouped DataFrame-like object.
 */
function grouping(df, by, opts = {}) {
	return df
	// const grouped = groupBy(df.data, by, opts)
	// return dataframe(grouped)
}

/**
 * Filters the DataFrame using the provided condition.
 * @param {Object} df - The DataFrame-like object to filter.
 * @param {Function} condition - The condition function to apply.
 * @returns {Object} The filtered DataFrame-like object.
 */
function where(df, condition) {
	// df.data = df.data.filter(condition)
	df.filter = condition
	return df
}

/**
 * Joins the DataFrame with another dataframe or object array.
 * @param {import('./types'.DataFrame)} df          - The DataFrame-like object to join.
 * @param {import('./types'.DataFrame)|Array} other - The DataFrame-like object or object array to join with.
 * @param {function} query                          - The function to be used for joining.
 * @param {import('./types'.JoinOptions)} opts      - The join options.
 */
function joinWith(df, other, query, opts) {
	const table = isDataFrame(other) ? other.data : other
	return dataframe(join(df.data, table, query, opts))
}

function select(df, ...columns) {
	let result = df.data
	if (Array.isArray(columns) && columns.length > 0) {
		result = df.data.map((row) => pick(columns, row))
	}
	if (df.filter) return result.filter(df.filter)
	return result
}
/**
 * Creates a new DataFrame-like object.
 * @param {Array} data - Array of objects representing rows of data.
 * @returns {Object} A new DataFrame-like object with methods for data manipulation.
 */
export function dataframe(data, options = {}) {
	if (!Array.isArray(data)) throw 'data must be an array of objects'

	const metadata =
		data.length === 0
			? []
			: Object.entries(data[0]).map(([name, value]) => ({ name, type: getType(value) }))
	const { columns = metadata.reduce((acc, column) => ({ ...acc, [column.name]: column }), {}) } =
		options
	let df = {
		data,
		metadata,
		columns
	}

	df.sortBy = (...columns) => sortBy(df, ...columns)
	df.groupBy = (by, opts = {}) => grouping(df, by, opts)
	df.where = (condition) => where(df, condition)
	df.join = (other, query, opts) => joinWith(df, other, query, opts)
	df.select = (...columns) => select(df, ...columns)
	return df
}
