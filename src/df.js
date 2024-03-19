import { pick, omit, equals } from 'ramda'
import { deriveSortableColumn } from './infer'
import { getType } from './utils'
import { getAggregator } from './aggregators'
import { includeAll, defaultConfig, pickAllowedConfig } from './constants'
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
	const config = { ...defaultConfig, ...pickAllowedConfig(options) }

	const df = {
		data,
		metadata,
		columns,
		config
	}

	// configure behaviour
	df.override = (config) => overrideConfig(df, config)
	df.where = (condition) => where(df, condition)
	df.groupBy = (...by) => groupBy(df, ...by)
	df.align = (...fields) => alignColumns(df, ...fields)
	df.using = (template) => usingTemplate(df, template)

	// returns new data frames
	df.join = (other, query, opts) => join(df, other, query, opts)
	df.leftJoin = (other, query, opts) => joinDataFrame(df, other, query, { ...opts, type: 'left' })
	df.rightJoin = (other, query, opts) => joinDataFrame(df, other, query, { ...opts, type: 'right' })
	df.innerJoin = (other, query, opts) => joinDataFrame(df, other, query, { ...opts, type: 'inner' })
	df.fullJoin = (other, query, opts) => joinDataFrame(df, other, query, { ...opts, type: 'full' })
	df.nestedJoin = (other, query, opts) => nestedJoin(df, other, query, opts)
	df.union = (other) => union(df, other)
	df.minus = (other) => minus(df, other)
	df.intersect = (other) => intersect(df, other)
	df.rename = (fields) => renameColumns(df, fields)
	df.drop = (...fields) => dropColumns(df, ...fields)
	df.rollup = (fields) => rollup(df, fields)

	// returns the same data frame with modifications
	df.sortBy = (...fields) => sortBy(df, ...fields)
	df.fillMissing = (value) => fill(df, value)
	df.fillNull = (value) => fill(df, value, null)
	df.update = (value) => updateRows(df, value)
	df.delete = () => deleteRows(df)
	df.select = (...fields) => select(df, ...fields)

	return df
}

/**
 * Exclude invalid fields from the input array
 * @param {Array} fields - The fields to exclude
 * @param {Object} columns - The columns to check against
 * @returns {Array} The valid fields
 */
function excludeInvalidFields(fields, columns) {
	return fields.filter((name) => columns[name] !== undefined)
}

/**
 * Overrides the configuration of the DataFrame object.
 * @param {import('./types').DataFrame} df - The DataFrame object to override.
 * @param {Object} config                  - The configuration to override.
 * @returns {import('./types').DataFrame}    The aligned DataFrame object.
 */
function overrideConfig(df, config = {}) {
	df.config = { ...df.config, ...pickAllowedConfig(config) }
	return df
}

/**
 * Aligns the columns of the DataFrame using the provided fields.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to align.
 * @param {...string} fields               - The fields to align.
 * @returns {import('./types').DataFrame}    The aligned DataFrame object.
 */
function alignColumns(df, ...fields) {
	df.config.align = excludeInvalidFields(fields, df.columns)
	return df
}

/**
 * Sets the template for adding empty rows in the DataFrame.
 * @param {import('./types').DataFrame} df - The DataFrame object to set the template for.
 * @param {Object} template                - The template to use for adding empty rows.
 * @returns {import('./types').DataFrame}    The DataFrame object.
 */
function usingTemplate(df, template) {
	df.config.template = template
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
	df.config.filter = condition
	return df
}

/**
 * Groups the DataFrame by the specified columns.
 * @param {import('./types').DataFrame} df - The DataFrame object to group.
 * @param {...string} fields              - The columns to group by.
 * @returns {import('./types').DataFrame} The grouped DataFrame object.
 */
function groupBy(df, ...fields) {
	df.config.group_by = excludeInvalidFields(fields, df.columns)
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
	let type = ['inner', 'left', 'right', 'full', 'nested'].includes(options.type)
		? options.type
		: 'inner'

	if (type === 'nested') return nestedJoin(df, other, query, options)
	return joinDataFrame(df, other, query, { ...options, type })
}

/**
 * Performs a join operation on two arrays based on the provided query condition.
 *
 * The join operation results in the following three results
 *
 * a) When a row is matched with one or more row in the second data set, attributes from both rows are combined. Result number of rows is equal to the number of matches.
 * b) When there is no match for a row in the second data set, only attributes from the first data set are included.
 * c) When there is no match for a row in the first data set, only attributes from the second data set are included.
 *
 * Based on the type of join, the result includes one or more of the above cases.
 *
 * - inner: Only includes case (a)
 * - outer: Includes case (a) & (b)
 * - full: Includes case (a), (b) & (c)
 *
 * @param {import('./types').DataFrame} df       - The first array to join, considered as the "left" side of the join.
 * @param {import('./types').DataFrame} other    - The second array to join, considered as the "right" side of the join.
 * @param {Function} query                       - A callback function that defines the join condition. Should return true for items to be joined, false otherwise.
 * @param {import('./types').JoinOptions} [opts] - Optional parameters to control the join behavior.
 * @returns {import('./types').DataFrame} - The result of the left join operation. If inner is true, entries from the first array without a match are excluded.
 */
function joinDataFrame(df, other, query, opts = {}) {
	const { type = 'outer' } = opts

	const leftRename = getAttributeRenamer(opts.left || {})
	const rightRename = getAttributeRenamer(opts.right || {})
	const leftRenameRow = getDataRenamer(leftRename, Object.keys(df.columns))
	const rightRenameRow = getDataRenamer(rightRename, Object.keys(other.columns))

	let combinedData = []

	// Process rows from the left DataFrame
	df.data.forEach((x) => {
		let matches = other.data
			.filter((y) => query(x, y))
			.map((y) => ({ ...rightRenameRow(y), ...leftRenameRow(x) }))
		if (matches.length === 0 && ['left', 'full'].includes(type)) {
			matches.push(leftRenameRow(x))
		}
		combinedData.push(...matches)
	})

	// Process rows from the right DataFrame for full outer join
	if (['full', 'right'].includes(type)) {
		other.data.forEach((y) => {
			if (!df.data.some((x) => query(x, y))) {
				combinedData.push(rightRenameRow(y))
			}
		})
	}

	const leftMetadata = df.metadata.map((x) => ({ ...x, name: leftRename(x.name) }))
	const rightMetadata = other.metadata
		.map((y) => ({ ...y, name: rightRename(y.name) }))
		.filter((y) => !leftMetadata.some((x) => x.name === y.name))

	return dataframe(combinedData, { metadata: leftMetadata.concat(rightMetadata) })
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
 * Summarizes the DataFrame by the specified columns.
 * @param {import('./types').DataFrame} df - The DataFrame object to summarize.
 * @param {Array} columns                  - The columns to summarize.
 *
 * @returns {import('./types').DataFrame}  The summarized DataFrame object.
 */
function rollup(df, columns = []) {
	if (columns.length === 0) {
		if (!Array.isArray(df.config.group_by) || df.config.group_by.length === 0) {
			throw new Error('Rollup requires at least one group column or aggregation')
		}
		const metadata = df.metadata.filter((col) => !df.config.group_by.includes(col.name))
		const keys = metadata.map((col) => col.name)
		columns = [{ name: df.config.children, ...getAggregator(keys), metadata }]
	}

	const keys = pick(df.config.group_by)
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

	const metadata = df.metadata.filter((col) => df.config.group_by.includes(col.name))

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

	df.config.group_by = []
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

	const filter = df.config.filter || includeAll
	df.data.forEach((row) => {
		if (filter(row)) {
			Object.entries(value).forEach(([k, v]) => (row[k] = v))
		}
	})
	df.config.filter = null
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
	const filter = df.config.filter || includeAll

	for (let i = df.data.length - 1; i >= 0; i--) {
		if (filter(df.data[i])) df.data.splice(i, 1)
	}

	df.config.filter = null
	return df
}

/**
 * Fills the missing values in the DataFrame with the specified values.
 * - Modifies the DataFrame in place.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to fill missing values in.
 * @param {Object} values                  - The values to fill the missing values with.
 * @param {any} [original]                 - The original value to be replaced. Defaults to undefined
 *
 * @returns {import('./types').DataFrame} The DataFrame object with the missing values filled.
 */
function fill(df, values, original = undefined) {
	df.data.forEach((row) => {
		Object.entries(values).forEach(([k, v]) => {
			if (row[k] === original) row[k] = v
		})
	})
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
	if (df.config.filter) result = result.filter(df.config.filter)

	df.config.filter = null
	return result
}
