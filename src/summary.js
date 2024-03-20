import { deriveAggregators } from './infer'

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
