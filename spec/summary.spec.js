import { describe, expect, it } from 'vitest'
import { sum, min, max, mean, deviation } from 'd3-array'
import { data } from './fixtures/data'

import { summarize } from '../src/summary'
import { counter, quantiles } from '../src/aggregators'

describe('aggregators', () => {
	const custom = (values) => ({
		sum: sum(values),
		min: min(values),
		max: max(values),
		mean: mean(values)
	})

	it('Should calculate counts', () => {
		expect(counter([1, 2, 3])).toEqual(3)
		expect(counter([1, 2, 3, 4, 5])).toEqual(5)
	})

	it('Should calculate quantiles', () => {
		expect(quantiles([1, 2, 3])).toEqual({
			iqr: 1,
			q1: 1.5,
			q3: 2.5,
			qr_min: 0,
			qr_max: 3
		})
		expect(quantiles([1, 2, 3, 4, 5])).toEqual({
			iqr: 2,
			q1: 2,
			q3: 4,
			qr_min: -1,
			qr_max: 5
		})
	})

	it('Should aggregate data', () => {
		let result = summarize(data, 'name')
		expect(result).toEqual({ name_count: 12 })
		result = summarize(data, 'name', 'country')
		expect(result).toEqual({ name_count: 12, country_count: 12 })
	})

	it('Should aggregate data using custom function', () => {
		let result = summarize(data, ['score', custom])

		expect(result).toEqual({
			score_sum: 1030,
			score_min: 10,
			score_max: 180,
			score_mean: 85.83333333333333
		})

		result = summarize(data, 'rank', ['age', custom])
		expect(result).toEqual({
			rank_count: 12,
			age_sum: 373,
			age_min: 18,
			age_max: 40,
			age_mean: 31.083333333333332
		})

		result = summarize(data, 'country', ['rank', deviation, 'std'])
		expect(result).toEqual({
			country_count: 12,
			rank_std: 3.605551275463989
		})
	})
})
