import { pick, omit, equals } from 'ramda'
import { deriveSortableColumn } from './infer'
import { getType } from './utils'
import { getAggregator } from './aggregators'
import { includeAll } from './constants'
import {
	combineMetadata,
	deriveColumnMetadata,
	deriveColumnIndex,
	getAttributeRenamer,
	getDataRenamer,
	getRenamerUsingLookup
} from './df-metadata'

/**
 * Creates a new DataFrame object.
 *
 * @param {Array} data  - Array of objects representing rows of data.
 * @param {Object} [options] - Optional parameters to control the DataFrame creation.
 * @param {Array} [options.metadata] - The metadata to use instead of deriving it from the data.
 * @returns {Object} A new DataFrame object with methods for data manipulation.
 */
export function dataframe(data, options = {}) {
	if (!Array.isArray(data)) throw new Error('data must be an array of objects')

	const metadata = deriveColumnMetadata(data, options)
	// create a column dictionary for easy access
	const columns = deriveColumnIndex(metadata)

	const df = {
		data,
		metadata,
		columns
	}

	df.where = (condition) => where(df, condition)
	df.groupBy = (...by) => groupBy(df, ...by)

	// returns new data frames
	df.join = (other, query, opts) => join(df, other, query, opts)
	df.outerJoin = (other, query, opts) => outerJoin(df, other, query, opts)
	df.innerJoin = (other, query, opts) => outerJoin(df, other, query, { ...opts, type: 'inner' })
	df.fullJoin = (other, query, opts) => fullJoin(df, other, query, opts)
	df.nestedJoin = (other, query, opts) => nestedJoin(df, other, query, opts)
	df.union = (other) => union(df, other)
	df.minus = (other) => minus(df, other)
	df.intersect = (other) => intersect(df, other)
	df.summarize = (fields) => summarize(df, fields)
	df.rename = (fields) => renameColumns(df, fields)
	df.drop = (...fields) => dropColumns(df, ...fields)

	// returns the same data frame with modifications
	df.sortBy = (...fields) => sortBy(df, ...fields)
	df.update = (value) => updateRows(df, value)
	df.delete = () => deleteRows(df)
	df.select = (...fields) => select(df, ...fields)

	return df
}

/**
 * Adds a filter to the DataFrame using the provided condition. This filter is applied
 * in subsequent operations like select, delete, and update.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to filter.
 * @param {Function} condition             - The condition function to apply.
 * @returns {import('./types').DataFrame}    The DataFrame object.
 */
function where(df, condition) {
	df.filter = condition
	return df
}

/**
 * Groups the DataFrame by the specified columns.
 * @param {import('./types').DataFrame} df - The DataFrame object to group.
 * @param {...string} columns              - The columns to group by.
 * @returns {import('./types').DataFrame} The grouped DataFrame object.
 */
function groupBy(df, ...by) {
	df.groups = by
	return df
}

/**
 * Joins the DataFrame with another dataframe or object array.
 * @param {import('./types'.DataFrame)} df     - The DataFrame object to join.
 * @param {import('./types'.DataFrame)} other  - The DataFrame object or object array to join with.
 * @param {function} query                     - The function to be used for joining.
 * @param {import('./types'.JoinOptions)} opts - The join options.
 */
function join(df, other, query, options = {}) {
	const { type } = options

	switch (type) {
		case 'outer':
			return outerJoin(df, other, query, options)
		case 'full':
			return fullJoin(df, other, query, options)
		case 'nested':
			return nestedJoin(df, other, query, options)
		default:
			return outerJoin(df, other, query, { ...options, type: 'inner' })
	}
}

/**
 * Performs a left join operation on two arrays based on the provided query condition. This will return all records from
 * the first array (a) and the matched records from the second array (b). If there is no match, the result is null (if inner is true)
 * or the record from the first array (if inner is false).
 *
 * @param {import('./types').DataFrame} df - The first array to join, considered as the "left" side of the join.
 * @param {import('./types').DataFrame} other - The second array to join, considered as the "right" side of the join.
 * @param {Function} query - A callback function that defines the join condition. Should return true for items to be joined, false otherwise.
 * @param {Object} [opts] - Optional parameters to control the join behavior.
 * @param {boolean} [opts.inner=true] - Determines if the join is an inner left join (false will include all of the "left" side even with no match).
 * @returns {import('./types').DataFrame} - The result of the left join operation. If inner is true, entries from the first array without a match are excluded.
 */
function outerJoin(df, other, query, opts = {}) {
	const { type = 'outer', left = {}, right = {} } = opts

	const renameX = getAttributeRenamer(left)
	const renameY = getAttributeRenamer(right)
	const renameRowForX = getDataRenamer(renameX, Object.keys(df.columns))
	const renameRowForY = getDataRenamer(renameY, Object.keys(other.columns))

	const combined = df.data
		.map((x) => {
			const matched = other.data
				.filter((y) => query(x, y))
				.map((y) => ({ ...renameRowForY(y), ...renameRowForX(x) }))
			return matched.length ? matched : type === 'inner' ? [] : [renameRowForX(x)]
		})
		.flat()

	const metadata = {}

	metadata.left = df.metadata.map((x) => ({ ...x, name: renameX(x.name) }))
	metadata.columns = metadata.left.map((x) => x.name)
	metadata.right = other.metadata
		.map((y) => ({ ...y, name: renameY(y.name) }))
		.filter((y) => !metadata.columns.includes(y.name))

	return dataframe(combined, { metadata: combineMetadata(metadata.left, metadata.right) })
}

/**
 * Performs a full join operation on two arrays based on the provided query condition.
 *
 * @param {import('./types').DataFrame} first  - The first array to join.
 * @param {import('./types').DataFrame} second - The second array to join.
 * @param {Function} query                     - A callback function that defines the join condition.
 * @param {import('./types').JoinOptions} how  - Parameters to control the join behavior and rename unmatched elements in the second array.
 *
 * @returns {import('./types').DataFrame} - The result of the full join operation.
 */
export function fullJoin(first, second, query, how = {}) {
	const renameY = getAttributeRenamer(how.right || {})
	const renameRowForY = getDataRenamer(renameY, Object.keys(second.columns))

	const res1 = outerJoin(first, second, query, omit(['type'], how))
	const res2 = second.data
		.map((y) => {
			const res = first.data.filter((x) => query(x, y))
			return res.length === 0 ? [renameRowForY(y)] : []
		})
		.flat()

	return dataframe([...res1.data, ...res2], { metadata: res1.metadata })
}

/**
 * Nest children objects under parent objects based on a matching condition.
 *
 * @param {import('./types').DataFrame} child  - Array of child objects.
 * @param {import('./types').DataFrame} parent - Array of parent objects.
 * @param {Function} using                     - Function to determine if a child matches a parent.
 * @param {import('./types').JoinOptions} how  - Options object with default 'children' attribute name.
 *
 * @returns {import('./types').DataFrame} - New DataFrame of parent objects with children nested under them.
 */
export function nestedJoin(child, parent, using, how = {}) {
	const { children = 'children' } = how
	const data = parent.data.map((p) => ({ ...p, [children]: child.data.filter((c) => using(c, p)) }))
	const metadata = [...parent.metadata, { name: children, type: 'array', metadata: child.metadata }]
	return dataframe(data, { metadata })
}

/**
 * Creates a union of two DataFrames.
 *
 * @param {import('./types').DataFrame} df    - The first DataFrame object.
 * @param {import('./types').DataFrame} other - The second DataFrame object.
 *
 * @returns {import('./types').DataFrame} The union of the two DataFrames.
 */
function union(df, other) {
	const metadata = combineMetadata(df.metadata, other.metadata)
	const data = [...df.data, ...other.data]
	return dataframe(data, { metadata })
}

/**
 * Creates a difference of two DataFrames.
 *
 * @param {import('./types').DataFrame} df    - The first DataFrame object.
 * @param {import('./types').DataFrame} other - The second DataFrame object.
 *
 * @returns {import('./types').DataFrame} The difference of the two DataFrames.
 */
function minus(df, other) {
	if (!equals(df.metadata, other.metadata)) return df
	const data = df.data.filter((row) => !other.data.some((r) => equals(row, r)))
	return dataframe(data, { metadata: df.metadata })
}

/**
 * Creates an intersection of two DataFrames.
 *
 * @param {import('./types').DataFrame} df    - The first DataFrame object.
 * @param {import('./types').DataFrame} other - The second DataFrame object.
 *
 * @returns {import('./types').DataFrame} The intersection of the two DataFrames.
 */
function intersect(df, other) {
	if (!equals(df.metadata, other.metadata)) return dataframe([])
	const data = df.data.filter((row) => other.data.some((r) => equals(row, r)))
	return dataframe(data, { metadata: df.metadata })
}

/**
 * Summarizes the DataFrame by the specified columns.
 * @param {import('./types').DataFrame} df - The DataFrame object to summarize.
 * @param {Array} columns                  - The columns to summarize.
 *
 * @returns {import('./types').DataFrame}  The summarized DataFrame object.
 */
function summarize(df, columns = []) {
	if (columns.length === 0) {
		if (!Array.isArray(df.groups) || df.groups.length === 0) {
			throw new Error('Summary requires at least one group column or aggregation')
		}
		const metadata = df.metadata.filter((col) => !df.groups.includes(col.name))
		const keys = metadata.map((col) => col.name)
		columns = [{ name: 'children', ...getAggregator(keys), metadata }]
	}

	const keys = pick(df.groups)
	const grouped = df.data.reduce((acc, row) => {
		const initialValue = columns.reduce((res, { name }) => ({ ...res, [name]: [] }), {})
		const key = JSON.stringify(keys(row))
		if (!acc[key]) acc[key] = { ...keys(row), ...initialValue }
		columns.forEach(({ name, mapper }) => acc[key][name].push(mapper(row)))
		return acc
	}, {})

	const data = Object.values(grouped).map((row) => ({
		...row,
		...columns.reduce((acc, { name, reducer }) => ({ ...acc, [name]: reducer(row[name]) }), {})
	}))

	const metadata = df.metadata.filter((col) => df.groups.includes(col.name))

	columns.forEach((col) => {
		const type = getType(data[0][col.name])
		if (type === 'array') {
			metadata.push({
				name: col.name,
				type,
				metadata: deriveColumnMetadata(data[0][col.name], pick(['metadata'], col))
			})
		} else {
			metadata.push({ name: col.name, type })
		}
	})
	return dataframe(data, { metadata })
}

/**
 * Renames the columns in the DataFrame.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to rename columns in.
 * @param {Object<string,string>} columns  - A key value pair where the key is the current column name and the value is the new column name.
 *
 * @returns {import('./types').DataFrame} The DataFrame object with the columns renamed.
 */
function renameColumns(df, columns) {
	const existing = Object.values(columns).filter((value) => df.columns[value] !== undefined)
	if (existing.length > 0)
		throw new Error(`Cannot rename to an existing column. [${existing.join(',')}]`)

	const exclude = Object.keys(columns).filter((key) => df.columns[key] === undefined)
	if (exclude.length > 0)
		throw new Error(`Cannot rename non-existing column(s) [${exclude.join(',')}].`)

	const lookup = {}
	const include = []

	const metadata = df.metadata.map((col) => {
		const newName = columns[col.name] || col.name
		lookup[col.name] = newName
		include.push(newName)
		return { ...col, name: newName }
	})

	const renamer = getRenamerUsingLookup(lookup)
	const data = df.data.map((row) => pick(include, renamer(row)))

	return dataframe(data, { metadata })
}

/**
 * Drops the specified columns from the DataFrame.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to drop columns from.
 * @param {...string} [columns]            - The columns to drop.
 *
 * @returns {import('./types').DataFrame} The DataFrame object with the columns dropped.
 */
function dropColumns(df, ...columns) {
	const metadata = df.metadata.filter((col) => !columns.includes(col.name))
	const data = df.data.map((row) => omit(columns, row))

	return dataframe(data, { metadata })
}

/**
 * Sorts the DataFrame by the specified columns.
 *
 * @param {import('./types').DataFrame} df                                    - The DataFrame object to sort.
 * @param {...{import('./types').SortableColumn} columns - The columns to sort by.
 *
 * @returns {Object}  The sorted DataFrame object.
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
	return df // returning the original DataFrame object
}

/**
 * Updates the rows in the DataFrame that satisfy the condition specified by the filter function.
 * - Modifies the DataFrame in place.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to update rows in.
 * @param {Object} value                    - The data to update the rows with.
 *
 * @returns {import('./types').DataFrame} The DataFrame object with the rows updated.
 */
function updateRows(df, value) {
	if (typeof value !== 'object') throw new Error('value must be an object')

	const filter = df.filter || includeAll
	df.data.forEach((row) => {
		if (filter(row)) {
			Object.entries(value).forEach(([k, v]) => (row[k] = v))
		}
	})
	df.filter = null
	df.metadata = combineMetadata(df.metadata, deriveColumnMetadata([value]), true)
	df.columns = deriveColumnIndex(df.metadata)
	return df
}

/**
 * Deletes the rows from the DataFrame that satisfy the condition specified by the filter function.
 * - Does not change the metadata of the DataFrame.
 * - Modifies the DataFrame in place.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to delete rows from
 *.
 * @returns {import('./types').DataFrame} The DataFrame object with the rows deleted.
 */
function deleteRows(df) {
	const filter = df.filter || includeAll

	for (let i = df.data.length - 1; i >= 0; i--) {
		if (filter(df.data[i])) df.data.splice(i, 1)
	}

	df.filter = null
	return df
}

/**
 * Selects the specified columns from the DataFrame.
 *
 * @param {import('./types').DataFrame} df  - The DataFrame object to select from.
 * @param {...string} [columns]             - The columns to select, if none are provided all columns are selected.
 *
 * @returns {Array}                         - The data set containing selected columns
 */
function select(df, ...columns) {
	let result = df.data
	if (Array.isArray(columns) && columns.length > 0) {
		result = df.data.map((row) => pick(columns, row))
	}
	if (df.filter) result = result.filter(df.filter)

	df.filter = null
	return result
}
