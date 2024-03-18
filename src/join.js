/**
 * Returns a function that renames keys of an object by adding a prefix or suffix to each key
 *
 * @param {import('./types.js').OptionsToRenameKeys} opts
 * @returns {Function} - A function that takes an object and returns a new object with renamed properties.
 */
export function renameUsing(opts = {}) {
	const { prefix, suffix, separator = '_' } = opts
	let rename = (x) => x
	if (prefix) {
		rename = (x) => [prefix, x].join(separator)
	} else if (suffix) {
		rename = (x) => [x, suffix].join(separator)
	}

	return (row) =>
		Object.entries(row).reduce((acc, [key, value]) => ({ ...acc, [rename(key)]: value }), {})
}

/**
 * Performs a left join operation on two arrays based on the provided query condition. This will return all records from
 * the first array (a) and the matched records from the second array (b). If there is no match, the result is null (if inner is true)
 * or the record from the first array (if inner is false).
 *
 * @param {Array} a - The first array to join, considered as the "left" side of the join.
 * @param {Array} b - The second array to join, considered as the "right" side of the join.
 * @param {Function} query - A callback function that defines the join condition. Should return true for items to be joined, false otherwise.
 * @param {Object} [opts] - Optional parameters to control the join behavior.
 * @param {boolean} [opts.inner=true] - Determines if the join is an inner left join (false will include all of the "left" side even with no match).
 * @returns {Array} - The result of the left join operation. If inner is true, entries from the first array without a match are excluded.
 */
function leftJoin(a, b, query, opts = {}) {
	const { inner = false } = { ...opts }
	const rename = renameUsing(opts)
	return a
		.map((x) => {
			const matched = b.filter((y) => query(x, y)).map((y) => ({ ...rename(y), ...x }))
			return matched.length ? matched : inner ? [] : [x]
		})
		.reduce((acc, cur) => [...acc, ...cur], [])
}

/**
 * Performs an inner join operation on two arrays based on the provided query condition.
 *
 * @param {Array} a - The first array to join.
 * @param {Array} b - The second array to join.
 * @param {Function} query - A callback function that defines the join condition.
 * @param {Object} [opts] - Optional parameters to control the join behavior.
 * @returns {Array} - The result of the inner join operation.
 */
export function innerJoin(a, b, query, opts = {}) {
	return leftJoin(a, b, query, { ...opts, inner: true })
}

/**
 * Performs an outer join operation on two arrays based on the provided query condition.
 *
 * @param {Array} a - The first array to join.
 * @param {Array} b - The second array to join.
 * @param {Function} query - A callback function that defines the join condition.
 * @param {Object} [opts] - Optional parameters to control the join behavior. Defaults to an inner join if no 'inner' property is specified.
 * @returns {Array} - The result of the outer join operation.
 */
export function outerJoin(a, b, query, opts = {}) {
	return leftJoin(a, b, query, { inner: false, ...opts })
}

/**
 * Performs a full join operation on two arrays based on the provided query condition.
 *
 * @param {Array} a - The first array to join.
 * @param {Array} b - The second array to join.
 * @param {Function} query - A callback function that defines the join condition.
 * @param {Object} opts - Parameters to control the join behavior and rename unmatched elements in the second array.
 * @returns {Array} - The result of the full join operation.
 */
export function fullJoin(a, b, query, opts) {
	const rename = renameUsing(opts)
	const res1 = outerJoin(a, b, query, opts)
	const res2 = b
		.map((y) => {
			const res = a.filter((x) => query(x, y))
			return res.length === 0 ? [{ ...rename(y) }] : []
		})
		.reduce((acc, cur) => [...acc, ...cur], [])
	return [...res1, ...res2]
}

/**
 * Joins two input arrays (a and b) based on a specified query condition, with support for various join types.
 *
 * @param {Array} first                - The first array to join.
 * @param {Array} second               - The second array to join.
 * @param {Function} query             - A callback function that defines the join condition.
 * @param {Object} [opts]              - Optional parameters to control the join behavior.
 * @param {string} [opts.type='inner'] - The type of join operation: 'inner', 'outer', or 'full'.
 * @returns {Array} - The result of the join operation.
 * @throws {Error} - Throws an error if an unknown join type is specified.
 */
export function join(first, second, query, opts = {}) {
	const { type = 'inner' } = opts
	switch (type) {
		case 'inner':
			return innerJoin(first, second, query, opts)
		case 'outer':
			return outerJoin(first, second, query, opts)
		case 'full':
			return fullJoin(first, second, query, opts)
		case 'nested':
			return nestJoin(first, second, query, opts)
		default:
			throw new Error(`Unknown join type: ${type}`)
	}
}

/**
 * Nest children objects under parent objects based on a matching condition.
 * @param {Array<Object>} child - Array of child objects.
 * @param {Array<Object>} parent - Array of parent objects.
 * @param {Function} using - Function to determine if a child matches a parent.
 * @param {Object} [options={}] - Options object with default 'children' attribute name.
 * @returns {Array<Object>} - New array of parent objects with children nested under them.
 */
export function nestJoin(child, parent, using, options = {}) {
	const { children = 'children' } = options
	return parent.map((p) => ({ ...p, [children]: child.filter((c) => using(c, p)) }))
}
