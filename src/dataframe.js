import { equals, omit, pick, clone, identity } from 'ramda'
import { defaultConfig, includeAll, pickAllowedConfig } from './constants'
import { deriveSortableColumn } from './infer'
import { combineMetadata, deriveColumnIndex, deriveColumnMetadata, buildMetadata } from './metadata'
import {
	groupDataByKeys,
	fillAlignedData,
	getAlignGenerator,
	aggregateData,
	defaultAggregator
} from './rollup'
import { getRenamer, getRenamerUsingLookup, leftJoin } from './join'

/**
 * Creates a new DataFrame object.
 *
 * @param {Array} data  - Array of objects representing rows of data.
 * @param {Object} [options] - Optional parameters to control the DataFrame creation.
 * @param {Array} [options.metadata] - The metadata to use instead of deriving it from the data.
 * @returns {import('./types').DataFrame} A new DataFrame object with methods for data manipulation.
 */
// eslint-disable-next-line max-lines-per-function
export function dataframe(data, options = {}) {
	if (!Array.isArray(data)) throw new Error('data must be an array of objects')

	const df = { data }

	df.metadata = deriveColumnMetadata(data, options)
	df.columns = deriveColumnIndex(df.metadata)
	df.config = { ...clone(defaultConfig), ...pickAllowedConfig(options) }

	// configure behaviour
	df.override = (props) => overrideConfig(df, props)
	df.where = (condition) => where(df, condition)
	df.groupBy = (...by) => groupBy(df, ...by)
	df.align = (...fields) => alignColumns(df, ...fields)
	df.using = (template) => usingTemplate(df, template)
	df.summarize = (from, using) => summarize(df, from, using)

	// join operations
	df.join = (other, query, opts) => join(df, other, query, opts)
	df.leftJoin = (other, query, opts) => joinDataFrame(df, other, query, { ...opts, type: 'left' })
	df.rightJoin = (other, query, opts) => joinDataFrame(df, other, query, { ...opts, type: 'right' })
	df.innerJoin = (other, query, opts) => joinDataFrame(df, other, query, { ...opts, type: 'inner' })
	df.fullJoin = (other, query, opts) => joinDataFrame(df, other, query, { ...opts, type: 'full' })
	df.nestedJoin = (other, query, opts) => nestedJoin(df, other, query, opts)

	// set operations
	df.union = (other) => union(df, other)
	df.minus = (other) => minus(df, other)
	df.intersect = (other) => intersect(df, other)

	// alter structure
	df.rename = (fields) => renameColumns(df, fields)
	df.drop = (...fields) => dropColumns(df, ...fields)

	// alter data
	df.sortBy = (...fields) => sortBy(df, ...fields)
	df.fillMissing = (value) => fill(df, value)
	df.fillNull = (value) => fill(df, value, null)
	df.update = (value) => updateRows(df, value)
	df.delete = () => deleteRows(df)

	// transform data
	df.rollup = () => rollup(df)
	df.apply = (fn) => applyFn(df, fn)

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
 * Aligns the columns of the DataFrame using the provided fields.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to align.
 * @param {...string} fields               - The fields to align.
 * @returns {import('./types').DataFrame}    The aligned DataFrame object.
 */
function alignColumns(df, ...fields) {
	df.config.align_by = excludeInvalidFields(fields, df.columns)
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
 * Adds a summary field to the DataFrame.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to add the summary field to.
 *
 * @param {string|Array<string>|Function}  from  - The field or function to fetch data for summary
 * @param {string|Object<string:Function>} using - The target field & formula to use for summarizing.
 * @returns {import('./types').DataFrame}          The DataFrame object.
 */
function summarize(df, from, using) {
	const mapper = typeof from === 'function' ? from : Array.isArray(from) ? pick(from) : pick([from])
	const reducers = []

	if (typeof using === 'string') reducers.push({ field: using, formula: identity })
	if (typeof using === 'object')
		Object.entries(using).forEach(([field, formula]) => reducers.push({ field, formula }))

	df.config.summaries.push({ mapper, reducers })

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
	const type = ['inner', 'left', 'right', 'full', 'nested'].includes(options.type)
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
	const renamer = getRenamer(Object.keys(df.columns), Object.keys(other.columns), opts)
	// Process rows from the left DataFrame
	const combinedData = leftJoin(df.data, other.data, query, renamer.row, type)

	// Process rows from the right DataFrame for full outer join
	if (['full', 'right'].includes(type)) {
		other.data.forEach((y) => {
			if (!df.data.some((x) => query(x, y))) {
				combinedData.push(renamer.row.right(y))
			}
		})
	}

	const leftMetadata = df.metadata.map((x) => ({ ...x, name: renamer.key.left(x.name) }))
	const rightMetadata = other.metadata
		.map((y) => ({ ...y, name: renamer.key.right(y.name) }))
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
 * @param {...string} [fields]            - The columns to drop.
 *
 * @returns {import('./types').DataFrame} The DataFrame object with the columns dropped.
 */
function dropColumns(df, ...fields) {
	const metadata = df.metadata.filter((col) => !fields.includes(col.name))
	const data = df.data.map((row) => omit(fields, row))

	return dataframe(data, { metadata })
}

/**
 * Sorts the DataFrame by the specified columns.
 *
 * @param {import('./types').DataFrame} df                                    - The DataFrame object to sort.
 * @param {import('./types').SortableColumn} fields - The columns to sort by.
 *
 * @returns {Object}  The sorted DataFrame object.
 */
function sortBy(df, ...fields) {
	const sorters = fields.map(deriveSortableColumn)

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
 * Summarizes the DataFrame by the specified columns.
 * @param {import('./types').DataFrame} df - The DataFrame object to summarize.
 * @param {Array} summaries                  - The columns to summarize.
 *
 * @returns {import('./types').DataFrame}  The summarized DataFrame object.
 */
function rollup(df) {
	if (df.config.group_by.length === 0 && df.config.summaries.length === 0) {
		throw new Error(
			'Use groupBy to specify the columns to group by or use summarize to add aggregators.'
		)
	}

	const summaries = clone(df.config.summaries)
	const hasAlignBy = df.config.align_by.length > 0
	if (summaries.length === 0) {
		summaries.push(defaultAggregator(df.metadata, df.config))
	}

	let alignedData = groupDataByKeys(df.data, df.config.group_by, summaries)

	if (hasAlignBy) {
		const fillRows = getAlignGenerator(df.data, df.config)
		alignedData = fillAlignedData(alignedData, df.config, fillRows)
	}

	const aggregatedData = aggregateData(alignedData, summaries)
	const newMetadata = buildMetadata(aggregatedData, df.metadata, df.config.group_by, summaries)

	return dataframe(aggregatedData, { metadata: newMetadata })
}

/**
 * Applies the specified function to the DataFrame returning a new DataFrame.
 *
 * @param {import('./types').DataFrame} df - The DataFrame object to apply the function to.
 * @param {function} fn                    - The function to apply to the DataFrame. Function applies row-wise.
 *
 * @returns {import('./types').DataFrame}  - The DataFrame object with the function applied.
 */
function applyFn(df, fn) {
	if (df.config.filter) return df.data.filter(df.config.filter).map(fn)
	return df.data.map(fn)
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
