import { filterOperations, typeConverters } from './constants'

/**
 * Filters a column-oriented data store based on the provided filtering criteria.
 *
 * @param {Object} store - The data store containing columnar data to filter. Should have 'data', 'columns', and 'types' keys.
 * @param {Object} filter - The filter object containing the 'column', 'value', and 'operator' keys.
 *                          'column' specifies the column to filter on (filters on all if not provided).
 *                          'value' specifies the value to filter against.
 *                          'operator' specifies the filter operation to apply.
 * @returns {Object} An object containing the filtered columnar data.
 * @throws {Error} Throws an error if the specified column does not exist in the data store.
 */
export function filterColumnarStore(store, filter) {
	const { data, columns, types } = store
	const { column, value, operator } = filter
	let indices = []

	if (column) {
		if (!columns.includes(column)) {
			throw new Error(`Column '${column}' not found in store`)
		}

		indices = data[column].reduce((acc, val, index) => {
			const filterType = types[column]
			const rowType = types[column]
			const typedValue = typeConverters[rowType](val)
			const typedFilter = typeConverters[filterType](value)
			if (filterOperations[operator](typedValue, typedFilter)) {
				acc.push(index)
			}
			return acc
		}, [])
	} else {
		columns.forEach((key) => {
			data[key].forEach((val, index) => {
				const filterType = types[key]
				const rowType = types[key]
				const typedValue = typeConverters[rowType](val)
				const typedFilter = typeConverters[filterType](value)
				if (filterOperations[operator](typedValue, typedFilter)) {
					if (!indices.includes(index)) {
						indices.push(index)
					}
				}
			})
		})
	}

	if (operator.startsWith('!')) {
		const allIndices = [...Array(data[columns[0]].length).keys()]
		indices = allIndices.filter((i) => !indices.includes(i))
	}

	const filteredData = {}
	columns.forEach((key) => {
		filteredData[key] = data[key].filter((rowValue, index) => indices.includes(index))
	})

	return filteredData
}
