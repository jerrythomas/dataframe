import { describe, expect, it } from 'vitest'
import { data } from './fixtures/data'
import { counter } from '../src/aggregators'
import { ascending, descending } from 'd3-array'

import {
	deriveColumns,
	deriveAggregators,
	deriveSortableColumns,
	deriveDataTypes,
	inferDataType
} from '../src/infer'

describe('utils', () => {
	const aggCols = [['score'], ['score', 'time'], ['score', 'time', 'name']]

	it('should derive column names', () => {
		expect(deriveColumns([])).toEqual([])
		expect(deriveColumns(data)).toEqual(Object.keys(data[0]))
		expect(deriveColumns([{ name: 'alpha' }, { rank: 1 }])).toEqual(['name', 'rank'])
	})

	it('should derive sorted columns', () => {
		expect(deriveSortableColumns('name')).toEqual([{ column: 'name', sorter: ascending }])
		expect(deriveSortableColumns('city', 'name')).toEqual([
			{ column: 'city', sorter: ascending },
			{ column: 'name', sorter: ascending }
		])
		expect(deriveSortableColumns(['city', false], 'name')).toEqual([
			{ column: 'city', sorter: descending },
			{ column: 'name', sorter: ascending }
		])
		expect(deriveSortableColumns(['city', true], ['name', false])).toEqual([
			{ column: 'city', sorter: ascending },
			{ column: 'name', sorter: descending }
		])
	})

	it.each(aggCols)('should derive column aggregators for', (...cols) => {
		const agg = deriveAggregators(...cols)
		const res = cols.map((column) => ({
			column,
			aggregator: counter,
			suffix: 'count'
		}))
		// console.log(agg)
		// console.log(res)
		expect(agg).toEqual(res)

		agg.map((col) => {
			expect(col.aggregator([1, 2, 3, 4])).toEqual(4)
		})
	})

	it('should infer a common datatype for an array of values', () => {
		expect(inferDataType([])).toEqual('undefined')
		expect(inferDataType([null])).toEqual('null')

		expect(inferDataType([{}, [], null])).toEqual('mixed')
		expect(inferDataType([[], [], null])).toEqual('array')
		expect(inferDataType([{}, {}, null])).toEqual('object')

		expect(inferDataType([null, 2, null, 4, 5, null])).toEqual('number')
		expect(inferDataType(['a', 'b', 'c', null])).toEqual('string')
		expect(inferDataType([true, false, true, null])).toEqual('boolean')
		expect(inferDataType([Date('2020-01-01'), '2020-01-02', '2020-01-03'])).toEqual('date')
		expect(inferDataType(['2020-01-01', '2020-01-02', '2020-01-03', 1])).toEqual('mixed')
	})
	it('should infer string and numeric columns', () => {
		const dataTypes = deriveDataTypes(data)
		expect(dataTypes).toEqual({
			string: ['country', 'name'],
			number: ['age', 'score', 'time', 'rank', 'level']
		})
	})
})
