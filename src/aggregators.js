import { quantile } from 'd3-array'
import { pick, identity } from 'ramda'
/**
 * Counts the number of values in an array.
 *
 * @param {Array} values - An array of values to count.
 * @returns {number} The count of values in the array.
 */
export const counter = (values) => values.length

/**
 * Calculates the quartiles and interquartile range (IQR) of a numeric data array.
 * Assumes that the `quantile` function is defined elsewhere and can calculate a
 * quantile for a given array of numbers and a probability.
 *
 * @param {number[]} values - An array of numeric values to calculate the quartiles for.
 * @returns {Object} An object containing the first quartile (q1), third quartile (q3),
 *                   interquartile range (iqr), and the minimum and maximum range values (qr_min, qr_max)
 *                   after applying the IQR rule for identifying potential outliers.
 */
export const quantiles = (values) => {
	const q1 = quantile(values, 0.25)
	const q3 = quantile(values, 0.75)
	const iqr = q3 - q1

	return { q1, q3, iqr, qr_min: q1 - 1.5 * iqr, qr_max: q1 + 1.5 * iqr }
}

/**
 * Returns an aggregator object with a mapper and reducer function.
 *
 * @param {string|string[]} keys - The key or keys to aggregate.
 * @param {Function} agg - The aggregation function.
 * @returns {Object} - An object with a mapper and reducer function.
 */
export function getAggregator(keys, agg) {
	const mapper = pick(Array.isArray ? keys : [keys])
	const reducer = typeof agg === 'function' ? agg : identity
	return {
		mapper,
		reducer
	}
}
