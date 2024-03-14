import { filterOperations, typeConverters } from './constants'

/**
 * Sorts a columnar data store according to the specified sorting columns and their respective order.
 *
 * @param {Object} dataStore - The data store containing columnar data to sort.
 * @param {Array<Object>} sortColumns - An array of objects defining the column names and their sort order.
 *                                      Each object should have a 'column' key with the name of the column,
 *                                      and an 'order' key with either 'asc' for ascending or 'desc' for descending.
 * @returns {Object} A new data store object with sorted data and original column names.
 */
export function sortDataStore(dataStore, sortColumns) {
	const indices = [...Array(dataStore.data[0].length).keys()]

	indices.sort((i, j) => {
		let comparison = 0
		for (const { column, order } of sortColumns) {
			if (dataStore.data[column][j] < dataStore.data[column][i]) {
				comparison = order === 'asc' ? 1 : -1
				break
			} else if (dataStore.data[column][j] > dataStore.data[column][i]) {
				comparison = order === 'asc' ? -1 : 1
				break
			}
		}
		return comparison
	})

	const sortedData = {}
	dataStore.columns.forEach((key) => {
		sortedData[key] = indices.map((i) => dataStore.data[key][i])
	})

	return { data: sortedData, columns: dataStore.columns }
}

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
