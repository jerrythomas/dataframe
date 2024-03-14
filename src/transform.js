import { flatGroup, ascending } from 'd3-array'
import { nest } from 'd3-collection'
import { pipe, map, pick, omit, uniq, mergeLeft, difference } from 'ramda'

/**
 * Creates a tweenable object with methods for keying, sorting, grouping, and rolling up data,
 * as well as a transform function to apply these operations.
 *
 * @returns {Object} An object that provides chaining methods for data transformation.
 */
export function tweenable() {
	let nestBy = null
	let sortOrder = ascending
	let groupBy = []
	let valueField = null

	const fns = {
		/**
		 * Sets the key function for nested grouping operations.
		 *
		 * @param {Function} k - The accessor function for the key.
		 * @returns {Object} The tweenable object for method chaining.
		 */
		key: (k) => {
			nestBy = k
			return fns
		},
		/**
		 * Sets the sort order function for sorting the nested groups.
		 *
		 * @param {Function} order - The sorting function.
		 * @returns {Object} The tweenable object for method chaining.
		 */
		sort: (order) => {
			sortOrder = order
			return fns
		},
		/**
		 * Sets the fields for grouping the data.
		 *
		 * @param {Array<string>} fields - The fields to group by.
		 * @returns {Object} The tweenable object for method chaining.
		 */
		group: (fields) => {
			groupBy = [...new Set(fields)]
			return fns
		},
		/**
		 * Sets the field for rolling up grouped values.
		 *
		 * @param {string} field - The field name to rollup.
		 * @returns {Object} The tweenable object for method chaining.
		 */
		rollup: (field) => {
			valueField = field
			return fns
		},
		/**
		 * Applies the configured tween operation on the input data.
		 *
		 * @param {Array<Object>} input - The data to transform.
		 * @returns {Array<Object>} The transformed data.
		 */
		transform: (input) => {
			let data = input

			if ((groupBy.length || nestBy) && valueField) {
				const fields = nestBy ? [nestBy] : []
				data = flatObjectGroup(input, [...fields, ...groupBy], valueField)
			}

			if (nestBy && valueField) {
				const fields = [...groupBy, nestBy, valueField]
				const combinations = pipe(map(pick(groupBy)), uniq)(input)
				const combiCounts = combinations
					.map((d) => JSON.stringify(d))
					.reduce((acc, item) => ({ ...acc, [item]: 0 }), {})

				const missingRows = pipe(
					map(pick(groupBy)),
					uniq,
					difference(combinations),
					map(mergeLeft({ [valueField]: [] }))
				)

				data = nest()
					.key((d) => d[nestBy])
					.sortKeys(sortOrder)
					.rollup((values) => values.map(omit([nestBy])))
					.entries(data.map(pick(fields)))

				data.forEach((d) =>
					d.value.forEach((x) => {
						const key = JSON.stringify(pick(groupBy, x))
						combiCounts[key] = Math.max(combiCounts[key], x[valueField].length)
					})
				)

				data = data.map(({ key, value }) => ({
					key,
					value: spread(
						addHiddenValues(value, missingRows, combiCounts, valueField, groupBy),
						valueField
					)
				}))
			} else if (groupBy.length && valueField) {
				data = spread(data, valueField)
			}
			return data
		}
	}

	return fns
}

/**
 * Adds hidden values to align the count of items across group entries based on the maximum count.
 *
 * @param {Array<Object>} values - The arrays of grouped and rolled up values.
 * @param {Function} missingRows - The function to identify and insert missing rows.
 * @param {Object} counts - An object mapping groups to maximum number of items in that group.
 * @param {string} valueField - The field holding the value array to add hidden values to.
 * @param {Array<string>} groupBy - The fields that data is grouped by.
 * @returns {Array<Object>} The values array with hidden values added.
 */
function addHiddenValues(values, missingRows, counts, valueField, groupBy) {
	const dummy = { y: 0, tweenVisibility: 0 }
	const sorter = multiAttributeSorter(groupBy)
	const result = [...values, ...missingRows(values)].sort(sorter).map((item) => {
		const key = JSON.stringify(pick(groupBy, item))
		const diff = counts[key] - item[valueField].length
		item[valueField] = [...item[valueField], ...Array(diff).fill(dummy)]
		return item
	})

	return result
}
/**
 *
 * @param {Array} array
 * @param {Array} fields
 * @param {String} y
 * @returns a flat grouped object array
 */
function flatObjectGroup(data, fields, y) {
	const attr = fields.map((x) => (d) => d[x])
	const keys = [...fields, y]
	const grouped = flatGroup(data, ...attr)
		.map((x) => x.reduce((acc, item, index) => ({ ...acc, [keys[index]]: item }), {}))
		.map((d) => ({
			...d,
			[y]: d[y].map((v) => ({ y: v[y], tweenVisibility: 1 }))
		}))

	return grouped
}

/**
 * Spreads an object into an array repeating all attributes for every item in the valueField array
 *
 * @param {Array} data
 * @param {String} valueField
 * @returns {Array} of objects
 */
function spread(data, valueField) {
	let result = []

	data.forEach((d) => {
		if (Array.isArray(d[valueField])) {
			const groups = omit([valueField], d)
			result = [
				...result,
				...d[valueField].map((v) => ({
					...groups,
					[valueField]: v.y,
					tweenVisibility: v.tweenVisibility
				}))
			]
		} else {
			result = [...result, d]
		}
	})
	return result
}

/**
 * https://stackoverflow.com/a/38037580
 *
 * @param {*} props
 * @returns
 */
function multiAttributeSorter(props) {
	return function (a, b) {
		for (let i = 0; i < props.length; i++) {
			const prop = props[i]
			const name = prop.name || prop
			const reverse = prop.reverse || false
			if (a[name] < b[name]) return reverse ? 1 : -1
			if (a[name] > b[name]) return reverse ? -1 : 1
		}
		return 0
	}
}
