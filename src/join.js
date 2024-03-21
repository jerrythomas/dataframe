import { identity } from 'ramda'
import { getAttributeRenamer } from './metadata'

/**
 * Returns a function that renames all the keys of an object using a lookup object
 *
 * @param {Object} lookup - An object that maps old keys to new keys.
 * @returns {Function}    - A function that takes an object and returns a new object with renamed properties.
 */
export function getRenamerUsingLookup(lookup) {
	return (row) =>
		Object.entries(row).reduce((acc, [key, value]) => ({ ...acc, [lookup[key]]: value }), {})
}

/**
 * Returns a function that renames all the keys of an object using a renamer function
 *
 * @param {Function} keyNamer - A function that takes a key and returns a new key.
 * @returns {Function}               - A function that takes an object and returns a new object with renamed properties.
 */
export function getDataRenamer(keyNamer, keys) {
	if (keyNamer === identity) return identity
	const lookup = keys.reduce((acc, key) => ({ ...acc, [key]: keyNamer(key) }), {})
	return getRenamerUsingLookup(lookup)
}

/**
 * Returns a an object with renamers for keys and rows
 * @param {Array<string>} first - columns of first data frame
 * @param {Array<string>} second - columns of second data frame
 * @param {import('./types').JoinOptions} opts - join options
 * @returns {Object} - an object with renamers for keys and rows
 */
export function getRenamer(first, second, opts) {
	const renamer = {}
	renamer.key = {
		left: getAttributeRenamer(opts.left || {}),
		right: getAttributeRenamer(opts.right || {})
	}

	renamer.row = {
		left: getDataRenamer(renamer.key.left, first),
		right: getDataRenamer(renamer.key.right, second)
	}
	return renamer
}

/**
 * Performs a left join operation on two arrays based on the provided query condition.
 *
 * @param {Array<Object>} data - The first array to join, considered as the "left" side of the join.
 * @param {Array<Object>} other - The second array to join, considered as the "right" side of the join.
 * @param {Function} query - A callback function that defines the join condition. Should return true for items to be joined, false otherwise.
 * @param {Function} renameRow - A callback function that renames the row based on the type of join.
 * @param {string} type - The type of join to perform. Can be 'inner', 'left', 'right', or 'full'.
 * @returns {Array<Object>} - The result of the left join operation.
 */
export function leftJoin(data, other, query, renameRow, type) {
	const combinedData = []

	data.forEach((x) => {
		const matches = other
			.filter((y) => query(x, y))
			.map((y) => ({ ...renameRow.right(y), ...renameRow.left(x) }))
		if (matches.length === 0 && ['left', 'full'].includes(type)) {
			matches.push(renameRow.left(x))
		}
		combinedData.push(...matches)
	})
	return combinedData
}
