import { dataframe } from './dataframe'

export function timelapse(by) {
	let defaults = {}
	let groupColumns = []

	const transform = (data) => {
		const df = dataframe(data)
			.sortBy(...groupColumns)
			.groupBy(by)
			.useDefaults(defaults)
			.distributeEvenlyInGroups(groupColumns)
			.sortBy(by)
		return df.data
	}

	const groupBy = (...cols) => {
		groupColumns = cols
		return { transform }
	}
	const useDefaults = (values) => {
		defaults = values
		return { groupBy }
	}

	return { useDefaults, groupBy }
}
