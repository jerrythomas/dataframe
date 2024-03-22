import { equals } from 'ramda'

/**
 * Dataset is a collection of data with a set of operations that can be performed on it.
 * @param {Array} data - The data to be stored in the dataset.
 * @returns {Object} - An object with a set of operations that can be performed on the dataset.
 */
export function dataset(data) {
	const actions = {
		get: () => data,
		union: (other) => {
			data = data.concat(other)
			return actions
		},
		intersect: (other) => {
			data = data.filter((d) => other.find((x) => equals(x, d)))
			return actions
		},
		difference: (other) => {
			data = data.filter((d) => !other.find((x) => equals(x, d)))
			return actions
		},
		rename: (renameObject) => {
			data = data.map(renameObject)
			return actions
		}
		// join: (other, condition) => {
		// 	return this
		// },
		// leftJoin: (other, condition) => {
		// 	return this
		// },
		// rightJoin: (other, condition) => {
		// 	return this
		// },
		// fullJoin: (other, condition) => {
		// 	return this
		// },
		// crossJoin: (other, condition) => {
		// 	return this
		// },
		// semiJoin: (other, condition) => {
		// 	return this
		// },
		// antiJoin: (other, condition) => {
		// 	return this
		// },
		// nestedJoin: (other, condition) => {
		// 	return this
		// }
	}

	return actions
}
