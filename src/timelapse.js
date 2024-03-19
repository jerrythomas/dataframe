import { dataframe } from './dataframe'

/**
 * Creates a timelapse transformation that sorts, groups, and distributes data evenly
 * within groups. It allows chaining configuration methods for specifying group columns
 * and default values.
 *
 * @param {string} by - The primary attribute by which the data will be grouped.
 * @returns {Object} An object with configuration methods for setting up the transformation.
 */
export function timelapse(by) {
	let defaults = {}
	let groupColumns = []

	/**
	 * Applies the transformation to the given dataset, sorting and distributing the
	 * data as previously configured.
	 *
	 * @param {Array<Object>} data - The dataset to transform.
	 * @returns {Array<Object>} The transformed dataset.
	 */
	const transform = (data) => {
		return dataframe(data)
			.sortBy(...groupColumns)
			.groupBy(by)
			.using(defaults)
			.align(...groupColumns)
			.rollup()
			.sortBy(by)
			.select()
	}

	/**
	 * Specifies the columns to be used for further grouping of the data.
	 *
	 * @param {...string} cols - Column names to group by.
	 * @returns {Object} An object containing the `transform` method for applying the transformation.
	 */
	const groupBy = (...cols) => {
		groupColumns = cols
		return { transform }
	}
	/**
	 * Sets default values to be used when data attributes are missing.
	 *
	 * @param {Object} values - An object mapping attribute names to their default values.
	 * @returns {Object} An object containing the `groupBy` method to specify grouping columns.
	 */
	const useDefaults = (values) => {
		defaults = values
		return { groupBy }
	}

	return { useDefaults, groupBy }
}
