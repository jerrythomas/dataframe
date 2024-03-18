import { pick, omit, equals, identity } from 'ramda'
import { deriveSortableColumn, getDeepScanSample } from './infer'
import { getType } from './utils'
import { getAggregator } from './aggregators'

const includeAll = () => true

function updateMetadata(first, second) {
	const metadata = [...first]
	second.map(({ name, type }) => {
		const existing = metadata.find((x) => x.name === name)
		if (existing) {
			existing.type = type
		} else {
			metadata.push({ name, type })
		}
	})
	return metadata
}
/**
 * Generates a renamer function which adds a prefix or suffix to a string.
 *
 * @param {OptionsToRenameKeys} options - Options to rename keys
 * @returns {Function} - A function that takes a string and adds a prefix or suffix.
 */
function getAttributeRenamer(options) {
	const { prefix, suffix, separator = '_' } = options
	let rename = identity
	if (prefix) {
		rename = (x) => [prefix, x].join(separator)
	} else if (suffix) {
		rename = (x) => [x, suffix].join(separator)
	}
	return rename
}

function getRenamerUsingLookup(lookup) {
	return (row) =>
		Object.entries(row).reduce((acc, [key, value]) => ({ ...acc, [lookup[key]]: value }), {})
}
/**
 * Returns a function that renames all the keys of an object using a renamer function
 *
 * @param {Function} keyNamer - A function that takes a key and returns a new key.
 * @returns {Function}               - A function that takes an object and returns a new object with renamed properties.
 */
function getDataRenamer(keyNamer, keys) {
	if (keyNamer === identity) return identity
	const lookup = keys.reduce((acc, key) => ({ ...acc, [key]: keyNamer(key) }), {})
	return getRenamerUsingLookup(lookup)
	// return (row) =>
	// 	Object.entries(row).reduce((acc, [key, value]) => ({ ...acc, [lookup[key]]: value }), {})
}
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
		innerJoin: 'function',
		outerJoin: 'function',
		nestedJoin: 'function',
		fullJoin: 'function',
		select: 'function'
	})
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
 * Summarizes the DataFrame by the specified columns.
 * @param {import('./types').DataFrame} df - The DataFrame object to summarize.
 * @param {Array} columns                  - The columns to summarize.
 *
 * @returns {import('./types').DataFrame}  The summarized DataFrame object.
 */
function summarize(df, columns = []) {
	if (columns.length === 0) {
		if (!Array.isArray(df.groups) || df.groups.length === 0) {
			throw new Error('No group columns specified')
		}
		const metadata = df.metadata.filter((col) => !df.groups.includes(col))
		const keys = metadata.map((col) => col.name)
		columns = [{ name: 'children', ...getAggregator(keys), metadata }]
	}

	const keys = pick(df.groups)
	const value = columns.reduce((acc, { name }) => ({ ...acc, [name]: [] }))
	const grouped = df.data.reduce((acc, row) => {
		const key = JSON.stringify(keys(row))
		if (!acc[key]) acc[key] = { ...keys(row), ...value }
		columns.map(({ name, mapper }) => acc[key][name].push(mapper(row)))
		return acc
	}, {})

	const data = grouped.values.map((row) => ({
		...row,
		...columns.reduce((acc, { name, reducer }) => ({ ...acc, [name]: reducer(row[name]) }), {})
	}))
	const metadata = df.metadata.filter((col) => df.cols.includes(col.name))
	columns.map(({ name, metadata }) => {
		const type = getType(data[0][name])
		if (type === 'array') {
			metadata.push({ name, type, metadata: deriveColumnMetadata(data[0][name], { metadata }) })
		} else {
			metadata.push({ name, type })
		}
	})
	return dataframe(data, { metadata })
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
 * Derives the column metadata from the provided data and options.
 *
 * @param {Array} data                       - The data to derive the column metadata from.
 * @param {Object} [options]                 - Optional parameters to control the metadata derivation.
 * @param {Array} [options.metadata]         - The metadata to use instead of deriving it from the data.
 * @param {boolean} [options.deepScan=false] - Determines if the metadata derivation should perform a deep scan of the data.
 *
 * @returns {import('./types').Metadata} The derived column metadata.
 */
function deriveColumnMetadata(data, options = {}) {
	const { metadata, deepScan = false } = options ?? {}
	if (Array.isArray(metadata) && metadata.length > 0) return metadata
	if (data.length === 0) return []
	const sample = deepScan ? getDeepScanSample(data) : data[0]
	return Object.entries(sample).map(([name, value]) => ({ name, type: getType(value) }))
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
 * Updates the rows in the DataFrame that satisfy the condition specified by the filter function.
 * - Modifies the DataFrame in place.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to update rows in.
 * @param {Object} value                    - The data to update the rows with.
 *
 * @returns {import('./types').DataFrame} The DataFrame object with the rows updated.
 */
function updateRows(df, value) {
	if (typeof value !== 'object') throw 'value must be an object'

	const filter = df.filter || includeAll
	df.data.forEach((row) => {
		if (filter(row)) {
			Object.entries(value).forEach(([key, value]) => (row[key] = value))
		}
	})
	df.filter = null
	df.metadata = updateMetadata(df.metadata, deriveColumnMetadata([value]))
	df.columns = df.metadata.reduce((acc, col, index) => ({ ...acc, [col.name]: index }), {})
	return df
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
	const isExisting = Object.values(columns).some((value) => df.columns[value] !== undefined)
	if (isExisting) throw 'Cannot rename to an existing column name'

	const exclude = Object.keys(columns).filter((key) => df.columns[key] !== undefined)
	if (exclude.length > 0) throw 'Cannot rename columns that do not exist.'

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
 * Creates a union of two DataFrames.
 *
 * @param {import('./types').DataFrame} df    - The first DataFrame object.
 * @param {import('./types').DataFrame} other - The second DataFrame object.
 *
 * @returns {import('./types').DataFrame} The union of the two DataFrames.
 */
function union(df, other) {
	const commonColumns = Object.keys(df.columns).filter((col) => other.columns[col] !== undefined)
	const metadata = [
		...df.metadata,
		...other.metadata.filter((col) => !commonColumns.includes(col.name))
	]

	const mixed = commonColumns.filter(
		(name) => df.metadata[df.columns[name]].type !== other.metadata[other.columns[name]].type
	)
	if (mixed.length > 0) throw `Mixed types in columns: ${mixed.join(', ')}`

	const data = [...df.data, ...other.data]
	return dataframe(data, { metadata })
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
 * Creates a new DataFrame object.
 *
 * @param {Array} data  - Array of objects representing rows of data.
 * @param {Object} [options] - Optional parameters to control the DataFrame creation.
 * @param {Array} [options.metadata] - The metadata to use instead of deriving it from the data.
 * @returns {Object} A new DataFrame object with methods for data manipulation.
 */
export function dataframe(data, options = {}) {
	if (!Array.isArray(data)) throw 'data must be an array of objects'

	const metadata = deriveColumnMetadata(data, options)
	// create a column dictionary for easy access
	const columns = deriveColumnIndex(metadata)

	let df = {
		data,
		metadata,
		columns
	}

	df.groupBy = (...by) => groupBy(df, ...by)
	df.where = (condition) => where(df, condition)

	// returns new data frames
	df.join = (other, query, opts) => join(df, other, query, opts)
	df.outerJoin = (other, query, opts) => outerJoin(df, other, query, opts)
	df.innerJoin = (other, query, opts) => outerJoin(df, other, query, { ...opts, type: 'inner' })
	df.fullJoin = (other, query, opts) => fullJoin(df, other, query, opts)
	df.nestedJoin = (other, query, opts) => nestedJoin(df, other, query, opts)
	df.select = (...columns) => select(df, ...columns)
	df.union = (other) => union(df, other)
	df.minus = (other) => minus(df, other)
	df.intersect = (other) => intersect(df, other)
	df.summarize = (columns) => summarize(df, columns)
	df.rename = (columns) => renameColumns(df, columns)
	df.drop = (...columns) => dropColumns(df, ...columns)

	// returns the same data frame with modifications
	df.sortBy = (...columns) => sortBy(df, ...columns)
	df.update = (data) => updateRows(df, data)
	df.delete = () => deleteRows(df)

	return df
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

	return dataframe(combined, { metadata: [...metadata.left, ...metadata.right] })
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
 * Derive column index from metadata.
 * @param {Array} metadata - The metadata array.
 * @returns {Object} - The column index object.
 */
function deriveColumnIndex(metadata) {
	return metadata.reduce((acc, col, index) => {
		acc[col.name] = index
		return acc
	}, {})
}
