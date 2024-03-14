import { v4 as uuid } from '@lukeed/uuid'
import { omit } from 'ramda'
import { join } from './join'
import { groupBy, summarize, fillMissingGroups } from './summary'
import { deriveColumns, deriveSortableColumns } from './infer'
import { __data__, __cols__, __opts__, __pkey__, __subdf__, __defaults__ } from './symbols'

const defaultOpts = {
	missingColumns: false
}

/**
 * Combines column names from the current set with keys from the given row,
 * ensuring that all column names are unique.
 *
 * @param {Array<string>} colnames - The current array of column names.
 * @param {Object} row - The row object whose keys will be added to the column names.
 * @returns {Array<string>} A new array containing the unique combination of current
 *                          column names and keys from the row object.
 */
function addColumnNames(colnames, row) {
	return [...new Set([...colnames, ...Object.keys(row)])]
}

/**
 * Represents a dataframe structure for storing tabular data with optional features
 * like automatic key generation, nested data grouping, and more.
 */
export class DataFrame {
	/**
	 * Creates an instance of the DataFrame class.
	 *
	 * @param {Array<Object>} data - Initial data to populate the DataFrame.
	 * @param {Object} [opts=defaultOpts] - Configuration options for the DataFrame instance.
	 */
	constructor(data, opts = defaultOpts) {
		this[__data__] = [...data]
		this[__opts__] = { ...opts }
		this[__subdf__] = '_df'
		this[__cols__] =
			data.length === 0 ? [] : opts.missingColumns ? deriveColumns(data) : Object.keys(data[0])

		this[__defaults__] = {}
		this[__pkey__] = undefined
		this[__opts__] = {
			missingColumns: opts.missingColumns || this[__cols__].length === 0,
			hasSurrogatePK: false,
			keepGroupsInNestedData: false,
			isGrouped: this[__cols__].includes(this[__subdf__])
		}
	}

	get data() {
		return this[__data__]
	}

	get columns() {
		return this[__cols__]
	}

	get opts() {
		return this[__opts__]
	}

	get pkey() {
		return this[__pkey__]
	}

	/**
	 * Sets the primary key for the DataFrame and adds a surrogate key if necessary.
	 *
	 * @param {string} [attr='id'] - The attribute to use as the primary key.
	 * @returns {DataFrame} The DataFrame instance for method chaining.
	 */
	key(attr = 'id') {
		this[__pkey__] = attr
		this[__opts__].hasSurrogatePK = !this[__cols__].includes(attr)
		if (this[__opts__].hasSurrogatePK) {
			this[__data__] = this[__data__].map((d) => ({ ...d, id: uuid() }))
		}
		return this
	}
	/**
	 * Configures whether to keep group columns in nested data.
	 *
	 * @param {boolean} [value=true] - Whether to keep the group columns.
	 * @returns {DataFrame} The DataFrame instance for method chaining.
	 */
	keepGroupsInNestedData(value = true) {
		this[__opts__].keepGroupsInNestedData = value
		return this
	}
	/**
	 * Adds an indicator to the data to distinguish actual data from generated data.
	 *
	 * @param {boolean} [value=true] - Whether to add an actual indicator.
	 * @returns {DataFrame} The DataFrame instance for method chaining.
	 */
	addActualIndicator(value = true) {
		this[__opts__].addActualIndicator = value
		return this
	}
	/**
	 * Sets the default values to use for missing data fields.
	 *
	 * @param {Object} values - An object mapping field names to their default values.
	 * @returns {DataFrame} The DataFrame instance for method chaining.
	 */
	useDefaults(values) {
		this[__defaults__] = values || {}
		return this
	}
	/**
	 * Inserts a new row into the DataFrame.
	 *
	 * @param {Object} row - The row object to insert.
	 * @returns {DataFrame} The DataFrame instance for method chaining.
	 */
	insert(row) {
		if (this[__opts__].missingColumns) {
			this[__cols__] = addColumnNames(this[__cols__], row)
		}

		this[__data__].push(this[__opts__].hasSurrogatePK ? { ...row, id: uuid() } : row)
		// add row to indexes
		return this
	}

	/**
	 * Deletes rows from the DataFrame that match the given query.
	 *
	 * @param {Function} query - A function to test each row for deletion.
	 * @returns {DataFrame} The DataFrame instance for method chaining.
	 */
	delete(query) {
		this[__data__] = this[__data__].filter((d) => !query(d))
		// reindex all indexes
		return this
	}

	/**
	 * Updates rows in the DataFrame that match the given query with the provided data.
	 *
	 * @param {Function|Object} query - A function to test each row for updating, or an object
	 *                                  with fields to update.
	 * @param {Object} [data] - The data to update with, if `query` is a function.
	 * @returns {DataFrame} The DataFrame instance for method chaining.
	 */
	update(query, data) {
		if (data) {
			this[__data__] = this[__data__].map((d) => (query(d) ? { ...d, ...data } : d))
			this[__cols__] = addColumnNames(this[__cols__], data)
			// reindex keys included in data
		} else {
			this[__data__] = this[__data__].map((d) => ({ ...d, ...query(d) }))
			// reindex all because we have no idea what changed
			this[__cols__] = addColumnNames(this[__cols__], this[__data__][0])
		}
		return this
	}

	/**
	 * Joins the DataFrame with another DataFrame or array of data based on a query.
	 *
	 * @param {DataFrame|Array<Object>} df - The DataFrame or Array to join with.
	 * @param {Function} query - A function that defines how the join is performed.
	 * @param {Object} [opts={}] - Additional options for the join operation.
	 * @returns {DataFrame} A new DataFrame resulting from the join operation.
	 * @throws {TypeError} If `df` is not an instance of DataFrame or an Array.
	 */
	join(df, query, opts = {}) {
		if (df instanceof DataFrame) {
			return new DataFrame(join(this[__data__], df.data, query, opts))
		} else if (Array.isArray(df)) {
			return new DataFrame(join(this[__data__], df, query, opts))
		}
		throw new TypeError(`expected DataFrame or Array, got ${typeof df}`)
	}

	/**
	 * Sorts the DataFrame based on the given columns.
	 *
	 * @param {...string|Object} cols - Columns to sort by. Can specify with direction.
	 * @returns {DataFrame} The DataFrame instance for method chaining.
	 */
	sortBy(...cols) {
		const opts = deriveSortableColumns(...cols)

		this[__data__] = this.data.sort((a, b) => {
			let result = 0
			for (let i = 0; i < opts.length && result === 0; i++) {
				result = opts[i].sorter(a[opts[i].column], b[opts[i].column])
			}
			return result
		})
		// reindex all since order has changed
		return this
	}

	/**
	 * Groups the DataFrame based on the specified columns.
	 *
	 * @param {...string} cols - Columns to group by.
	 * @returns {DataFrame} A new DataFrame with data grouped by the specified columns.
	 */
	groupBy(...cols) {
		return new DataFrame(
			groupBy(this[__data__], cols, {
				exclude: this[__opts__].keepGroupsInNestedData ? [] : cols
			})
		)
	}

	/**
	 * Fills missing values in the DataFrame columns according to provided defaults.
	 *
	 * @param {Object} [values] - An object specifying default values to fill.
	 * @returns {DataFrame} The DataFrame instance for method chaining.
	 */
	fillMissing(values) {
		if (values) this[__defaults__] = values

		this[__data__] = this[__data__].map((d) => {
			Object.entries(this[__defaults__]).forEach(([key, value]) => {
				if (d[key] === undefined || d[key] === null) d[key] = value
			})
			return d
		})
		return this
	}

	/**
	 * Fills in missing group combinations in the DataFrame and distributes data evenly.
	 *
	 * @param {Array<string>} cols - Columns to identify unique groups and fill missing ones.
	 * @returns {DataFrame} A new DataFrame instance with missing groups filled in.
	 */
	distributeEvenlyInGroups(cols) {
		if (this[__opts__].isGrouped) {
			const opts = {
				cols: Object.keys(this[__data__][0][this[__subdf__]][0]),
				defaults: this[__defaults__],
				addActualIndicator: this[__opts__].addActualIndicator
			}

			return new DataFrame(fillMissingGroups(this[__data__], cols, opts))
		}
		return this
	}

	/**
	 * Summarizes the DataFrame data attributes based on the specified columns.
	 *
	 * @param {...Object} cols - Columns definitions containing an aggregator function for summarization.
	 * @returns {DataFrame} A new DataFrame instance with the summarized data.
	 */
	summarize(...cols) {
		let result = []
		if (this[__opts__].isGrouped) {
			result = this[__data__].map((row) => ({
				...omit(['_df'], row),
				...summarize(row._df, ...cols)
			}))
		} else {
			result = [summarize(this[__data__], ...cols)]
		}
		return new DataFrame(result)
	}
}

/**
 * Factory function for creating a DataFrame instance.
 *
 * @param {Array<Object>} data - Initial data to populate the DataFrame.
 * @param {Object} opts - Configuration options for the DataFrame instance.
 * @returns {DataFrame} A new DataFrame instance.
 */
export function dataframe(data, opts) {
	return new DataFrame(data, opts)
}
