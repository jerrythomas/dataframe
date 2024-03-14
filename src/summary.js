import { identity, omit, pick, mergeLeft, map, difference, uniq, pipe } from 'ramda'
import { deriveAggregators } from './infer'

/**
 * Groups an array of data objects by specified key(s) and selects or omits certain properties from the grouped data.
 *
 * @param {Array<Object>} data - The array of objects to be grouped.
 * @param {Array<string>|string} by - The property name(s) used for grouping the data.
 * @param {Object} [opts={}] - Optional configurations for grouping:
 *      opts.include - An array of property names to be included in the result (if provided, `opts.exclude` is ignored).
 *      opts.exclude - An array of property names to be excluded from the result (used if `opts.include` is not provided).
 * @returns {Array<Object>} An array of grouped data objects, where each has a property `_df` that
 *                          is an array containing the selected or omitted properties of the original objects.
 * @example
 * // Suppose we have an array of person objects with properties: name, age, and gender,
 * // and we want to group by 'gender' and include only 'name' in the results. We could call:
 * groupBy(persons, 'gender', { include: ['name'] });
 * // This would return something like:
 * // [{ gender: 'M', _df: [{ name: 'John' }, { name: 'Bob' }] }, { gender: 'F', _df: [{ name: 'Alice' }] }]
 */
export function groupBy(data, by, opts = {}) {
	// A function to select properties to be included in the grouped result, based on `opts.include` or `opts.exclude`.
	const select = opts.include ? pick(opts.include) : omit(opts.exclude || [])
	const grouped = data.reduce((acc, cur) => {
		// Extract the grouping key(s) from the current object.
		const group = pick(by, cur)
		// Use the `select` function to filter properties of the current object.
		const value = select(cur)
		// Convert the group object into a unique string key.
		const key = JSON.stringify(group)

		// If filtering yielded properties, prepare them in an array; otherwise, use an empty array.
		const _df = Object.keys(value).length > 0 ? [value] : []

		// If the group already exists, concate the new data; otherwise, create a new group.
		if (key in acc) {
			acc[key]._df = [...acc[key]._df, ..._df]
		} else {
			acc[key] = { ...group, _df }
		}
		return acc
	}, {})

	// Return the grouped data as an array of objects.
	return Object.values(grouped)
}

/**
 * Summarizes the dataset by applying specified aggregator functions to each column.
 *
 * The `summarize` function takes an array of data objects and a variable number of
 * column definitions with associated aggregators and computes the summary statistics
 * for each column. The result is an object where each key is the name of the column
 * optionally suffixed by the aggregator's name, and the value is the result of the
 * aggregation.
 *
 * @param {Object[]} data - An array of objects representing the dataset.
 * @param {...Object} cols - A variable number of objects and/or tuples that define
 *                           columns and their respective aggregation function(s).
 *                           Each column definition has a `column` property specifying
 *                           the column's name and an `aggregator` property representing
 *                           the function to aggregate the column's values.
 * @returns {Object} An object containing summarized values for each column.
 *                   The keys are named after columns, potentially suffixed by the
 *                   aggregator's name if provided.
 * @example
 * // Suppose data is an array of objects and we want to summarize 'age' using the 'average' aggregator,
 * // and 'salary' using both 'min' and 'max' aggregators.
 * summarize(data, { column: 'age', aggregator: average }, { column: 'salary', aggregator: [min, max] });
 * // The result might look like: { age_average: 30, salary_min: 20000, salary_max: 150000 }
 */
export function summarize(data, ...cols) {
	// A function to construct the result key name by combining column name and suffix, if provided.
	const rename = (name, suffix) => {
		return suffix ? [name, suffix].join('_') : name
	}

	// Derive aggregator functions from the provided column definitions.
	const opts = deriveAggregators(...cols)
	const result = opts
		.map((col) => {
			// Extract the values for the specified column from the dataset.
			const values = data.map((row) => Number(row[col.column]))
			// Apply the aggregator function to the extracted values.
			let aggResult = col.aggregator(values)

			// If the aggregation result is an object, create a new object with renamed keys.
			if (typeof aggResult === 'object') {
				aggResult = Object.keys(aggResult).reduce(
					(acc, suffix) => ({
						...acc,
						[rename(col.column, suffix)]: aggResult[suffix]
					}),
					{}
				)
			} else {
				// For single-value results, use the renamed column as the key.
				const name = rename(col.column, col.suffix)
				aggResult = { [name]: aggResult }
			}
			return aggResult
		})
		// Combine all result objects into a single summary object.
		.reduce((acc, curr) => ({ ...acc, ...curr }), {})

	return result
}

/**
 * Creates a generator function for missing rows in a dataset, based on specified columns.
 *
 * The function determines all unique combinations of the specified columns (`cols`)
 * in the data and returns a generator function to create the missing combinations,
 * potentially with default values for other columns.
 *
 * @param {Array<Object>} data - The array of objects representing the dataset.
 * @param {Array<string>} cols - The columns to be used for identifying unique groups.
 * @param {Object} [opts={}] - Optional configurations:
 *      opts.cols - Array of columns to use if provided, otherwise inferred from data.
 *      opts.defaults - Default values for imputing missing data if provided.
 * @returns {Function} A generator function that when called, produces the missing rows.
 */
export function getGeneratorForMissingRows(data, cols, opts = {}) {
	// Determine the list of columns to use (either `opts.cols` or by inferring from the first data object).
	const columns = opts.cols || Object.keys(data[0])

	// Extract columns not used for grouping and prepare an object with nulls for these remaining columns.
	const remaining = columns
		.filter((x) => !cols.includes(x))
		.reduce((acc, x) => ({ ...acc, [x]: null }), {})

	// Combine user-provided default values with the above `remaining` to create an imputed values object.
	const imputedValues = { ...remaining, ...(opts.defaults || {}) }

	// Create an array of unique groups based on the specified `cols`.
	const groups = pipe(map(pick(cols)), uniq)(data)

	// A generator function that, when called, determines the difference between all possible combinations
	// and existing groups, then imputes the missing ones with `imputedValues`.
	const generator = pipe(map(pick(cols)), uniq, difference(groups), map(mergeLeft(imputedValues)))

	return generator
}

/**
 * Fills in missing group combinations in a dataset based on specified columns.
 *
 * This function takes a dataset, identifies the unique group combinations
 * based on the specified columns, and generates the missing combinations.
 * Optionally, an actual indicator can be added to distinguish between original
 * and generated data.
 *
 * @param {Array} data - The dataset to process, where each element contains a
 *                       record with a ._df property that is an array of group data.
 * @param {Array.<string>} cols - An array of column names to identify unique groups.
 * @param {Object} [opts={}] - Optional configurations for processing.
 *                 If opts.addActualIndicator is true, an `_actual` flag is added
 *                 to each row to indicate if it is original data (1) or generated (0).
 * @returns {Array} A new dataset with missing groups filled in.
 * @throws {TypeError} If `cols` is not an array of column names.
 * @throws {Error} If `cols` is an empty array.
 */
export function fillMissingGroups(data, cols, opts = {}) {
	if (!Array.isArray(cols)) throw new TypeError('cols must be an array of column names')
	if (cols.length === 0) throw new Error('cols must contain at least one column')
	const addAttr = !opts.addActualIndicator
		? identity
		: (d, _actual) => d.map((x) => ({ ...x, _actual }))

	const subset = data.map((d) => d._df).reduce((acc, x) => acc.concat(x), [])
	const generateRows = getGeneratorForMissingRows(subset, cols, opts)

	return data.map((d) => ({
		...omit(['_df'], d),
		_df: [...addAttr(d._df, 1), ...addAttr(generateRows(d._df), 0)]
	}))
}
