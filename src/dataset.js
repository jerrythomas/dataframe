import { equals, identity, pick } from 'ramda'

/**
 * Dataset is a collection of data with a set of operations that can be performed on it.
 * @param {Array} data - The data to be stored in the dataset.
 * @returns {Object} - An object with a set of operations that can be performed on the dataset.
 */

export function dataset(data) {
	let where_condition = null

	const actions = {
		where: (condition) => {
			where_condition = condition
			return actions
		},
		select: (...cols) => {
			const result = where_condition ? data.filter(where_condition) : data
			if (cols.length > 0) return result.map(pick(cols))
			return result
		},
		rename: (how) => dataset(renameKeys(data, how)),
		union: (other) => dataset(data.concat(other)),
		intersect: (other) => dataset(data.filter((d) => other.find((x) => equals(x, d)))),
		difference: (other) => dataset(data.filter((d) => !other.find((x) => equals(x, d)))),
		innerJoin: (other, condition) => dataset(innerJoin(data, other.select(), condition)),
		leftJoin: (other, condition) => dataset(leftJoin(data, other.select(), condition)),
		rightJoin: (other, condition) => dataset(rightJoin(data, other.select(), condition)),
		fullJoin: (other, condition) => dataset(fullJoin(data, other.select(), condition)),
		crossJoin: (other, condition) => dataset(crossJoin(data, other.select(), condition)),
		semiJoin: (other, condition) => dataset(semiJoin(data, other.select(), condition)),
		antiJoin: (other, condition) => dataset(antiJoin(data, other.select(), condition)),
		nestedJoin: (other, condition) => dataset(nestedJoin(data, other.select(), condition))
	}

	return actions
}

/**
 * Joins two datasets together based on a condition. Result includes all rows from the first
 * dataset and matching rows from the second dataset. In case of multiple matches, all
 * combinations are returned. When combining the rows, the columns from the first dataset take
 * precedence.
 *
 * inner: only the rows that have a match in both datasets.
 * outer: all rows from the first dataset and matching rows from the second dataset.
 *
 * @param {Array}    first     - The first dataset to join.
 * @param {Array}    second    - The second dataset to join.
 * @param {Function} condition - The condition to join the datasets on.
 * @returns {Object}           - An object with the inner and outer join result.
 */
function joinData(first, second, condition) {
	let inner = []
	const outer = []

	first.forEach((f) => {
		const matches = second.filter((s) => condition(f, s)).map((m) => ({ ...m, ...f }))
		inner = inner.concat(matches)
		if (matches.length === 0) outer.push(f)
	})
	return { inner, outer }
}

/**
 * Filters the results of the first dataset based on the condition using the second dataset.
 *
 * @param {Array}    first     - The first dataset to filter.
 * @param {Array}    second    - The second dataset to filter by.
 * @param {Function} condition - The condition to filter the first dataset by.
 * @returns {Array}            - The filtered dataset.
 */
function antiJoin(first, second, condition) {
	return first.filter((f) => !second.find((s) => condition(f, s)))
}

/**
 * Joins two datasets together based on a condition. Result includes all rows from the first
 * dataset and matching rows from the second dataset. In case of multiple matches, all
 * combinations are returned. When combining the rows, the columns from the first dataset take
 * precedence.
 *
 * @param {Array}    first     - The first dataset to join.
 * @param {Array}    second    - The second dataset to join.
 * @param {Function} condition - The condition to join the datasets on.
 * @returns {Array}            - The joined dataset.
 */
function innerJoin(first, second, condition) {
	const { inner } = joinData(first, second, condition)
	return inner
}

/**
 * Performs a left join on two datasets based on a condition. Result includes all rows from the first
 * dataset and matching rows from the second dataset. In case of multiple matches, all combinations
 * are returned. When combining the rows, the columns from the first dataset take precedence.
 * If there is no match in the second dataset, only the row from the first dataset is returned.
 *
 * @param {Array}    first     - The first dataset to join.
 * @param {Array}    second    - The second dataset to join.
 * @param {Function} condition - The condition to join the datasets on.
 * @returns {Array}            - The joined dataset.
 */
function leftJoin(first, second, condition) {
	const { inner, outer } = joinData(first, second, condition)
	return inner.concat(outer)
}

/**
 * Performs a right join on two datasets based on a condition. Result includes all rows from the second
 * dataset and matching rows from the first dataset. In case of multiple matches, all combinations
 * are returned. When combining the rows, the columns from the second dataset take precedence.
 * If there is no match in the first dataset, only the row from the second dataset is returned.
 *
 * @param {Array}    first     - The first dataset to join.
 * @param {Array}    second    - The second dataset to join.
 * @param {Function} condition - The condition to join the datasets on.
 * @returns {Array}            - The joined dataset.
 */
function rightJoin(first, second, condition) {
	const { inner, outer } = joinData(second, first, condition)
	return inner.concat(outer)
}

/**
 * Performs a full join on two datasets based on a condition. Result includes all rows from both
 * datasets. In case of multiple matches, all combinations are returned. When combining the rows,
 * the columns from the first dataset take precedence. If there is no match in the second dataset,
 * only the row from the first dataset is returned. If there is no match in the first dataset, only
 * the row from the second dataset is returned.
 *
 * @param {Array}    first     - The first dataset to join.
 * @param {Array}    second    - The second dataset to join.
 * @param {Function} condition - The condition to join the datasets on.
 * @returns {Array}            - The joined dataset.
 */
function fullJoin(first, second, condition) {
	const { inner, outer } = joinData(first, second, condition)
	const rightOuter = antiJoin(second, first, condition)
	return inner.concat(outer).concat(rightOuter)
}

/**
 * Performs a cross join on two datasets. Result includes all combinations of rows from both datasets.
 *
 * @param {Array} first  - The first dataset to join.
 * @param {Array} second - The second dataset to join.
 * @returns {Array}      - The joined dataset.
 */
function crossJoin(first, second) {
	return first.map((f) => second.map((s) => ({ ...f, ...s }))).flat()
}

/**
 * Performs a semi join on two datasets based on a condition. Result includes all rows from the first
 * dataset that have a match in the second dataset.
 *
 * @param {Array}    first     - The first dataset to join.
 * @param {Array}    second    - The second dataset to join.
 * @param {Function} condition - The condition to join the datasets on.
 * @returns {Array}            - The joined dataset.
 */
function semiJoin(first, second, condition) {
	return first.filter((f) => second.find((s) => condition(f, s)))
}

/**
 * Performs a nested join on two datasets based on a condition. Result includes all rows from the first
 * dataset that have a match in the second dataset. The result is nested with the matching rows from the
 * second dataset.
 *
 * @param {Array}    first            - The first dataset to join.
 * @param {Array}    second           - The second dataset to join.
 * @param {Function} condition        - The condition to join the datasets on.
 * @param {String}   [key='children'] - The key to nest the matching rows under.
 * @returns {Array}            - The joined dataset.
 */
function nestedJoin(first, second, condition, key = 'children') {
	const result = first.map((f) => ({
		...f,
		[key]: second.filter((s) => condition(f, s))
	}))
	return result
}

function renameKeys(data, how) {
	const rename = typeof how === 'function' ? how : renameKeysUsingMap(how)
	return data.map(rename)
}

function renameKeysUsingMap(lookup) {
	return (row) => Object.entries(row).reduce((acc, [k, v]) => ({ ...acc, [lookup[k] || k]: v }), {})
}
