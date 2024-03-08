import { describe, expect, it } from 'vitest'
import { data } from './fixtures/data'
import { counter } from '../src/aggregators'
import { ascending, descending } from 'd3-array'

import {
	deriveColumns,
	deriveAggregators,
	deriveSortableColumns,
	deriveDataTypes,
	inferDataType,
	deriveActions,
	convertToActions,
	deriveColumnMetadata,
	deriveHierarchy
} from '../src/infer'

describe('infer', () => {
	describe('deriveColumns', () => {
		it('should derive column names', () => {
			expect(deriveColumns([])).toEqual([])
			expect(deriveColumns(data)).toEqual(Object.keys(data[0]))
		})

		it('should derive column names from mixed data', () => {
			const mixedData = [
				{ name: 'alpha', rank: 1 },
				{ name: 'beta', rank: 2, score: 100 }
			]
			expect(deriveColumns(mixedData, true)).toEqual(['name', 'rank', 'score'])
		})
	})

	describe('deriveSortableColumns', () => {
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
	})

	describe('deriveAggregators', () => {
		const aggCols = [['score'], ['score', 'time'], ['score', 'time', 'name']]

		it.each(aggCols)('should derive column aggregators', (...cols) => {
			const agg = deriveAggregators(...cols)
			const res = cols.map((column) => ({
				column,
				aggregator: counter,
				suffix: 'count'
			}))

			expect(agg).toEqual(res)

			agg.map((col) => {
				expect(col.aggregator([1, 2, 3, 4])).toEqual(4)
			})
		})
	})

	describe('inferDataType', () => {
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
	})

	describe('deriveDataTypes', () => {
		it('should infer string and numeric columns', () => {
			const dataTypes = deriveDataTypes(data)
			expect(dataTypes).toEqual({
				string: ['country', 'name'],
				number: ['age', 'score', 'time', 'rank', 'level']
			})
		})
	})

	describe('convertToActions', () => {
		it('should convert an array of strings to an array of action objects', () => {
			const input = ['edit', 'delete', 'select']
			const output = convertToActions(input)
			expect(output).toEqual([
				{ name: 'select', label: 'select', order: 0 },
				{ name: 'edit', label: 'edit', order: 1 },
				{ name: 'delete', label: 'delete', order: 2 }
			])
		})

		it('should convert an array of action objects to an array of action objects', () => {
			const input = [
				{ name: 'delete', label: 'Delete' },
				{ name: 'edit', label: 'Edit' }
			]
			const output = convertToActions(input)
			expect(output).toEqual([
				{ name: 'edit', label: 'Edit', order: 1 },
				{ name: 'delete', label: 'Delete', order: 2 }
			])
		})
	})

	describe('addActions', () => {
		it('should add actions to the column metadata', () => {
			const columns = [{ name: 'name', dataType: 'string', fields: { text: 'name' } }]
			const input = ['edit', 'delete', 'select']
			const output = deriveActions(columns, input)
			expect(output).toEqual([
				{
					label: 'select',
					action: 'select'
				},
				{
					label: 'edit',
					action: 'edit'
				},
				{
					label: 'delete',
					action: 'delete'
				},
				{
					name: 'name',
					dataType: 'string',
					fields: { text: 'name' }
				}
			])
		})

		it('should add actions to the column metadata with action objects', () => {
			const columns = [
				{ name: 'name', dataType: 'string', fields: { text: 'name' } },
				{
					label: 'Edit',
					action: 'edit'
				}
			]
			const input = ['delete', 'edit']
			const output = deriveActions(columns, input)
			expect(output).toEqual([
				{
					label: 'delete',
					action: 'delete'
				},
				{
					name: 'name',
					dataType: 'string',
					fields: { text: 'name' }
				},
				{
					label: 'Edit',
					action: 'edit'
				}
			])
		})
	})

	describe('deriveColumnMetadata', () => {
		it('should return empty array for empty data', () => {
			expect(deriveColumnMetadata([])).toEqual([])
		})
		it('should derive column metadata', () => {
			const data = [
				{ name: 'John', age: 25, salary: 50000 },
				{ name: 'Jane', age: 30, salary: 60000 }
			]
			const metadata = deriveColumnMetadata(data)
			expect(metadata).toEqual([
				{
					name: 'name',
					dataType: 'string',
					fields: { text: 'name' },
					formatter: expect.any(Function)
				},
				{
					name: 'age',
					dataType: 'number',
					fields: { text: 'age' },
					formatter: expect.any(Function)
				},
				{
					name: 'salary',
					dataType: 'number',
					fields: { text: 'salary' },
					formatter: expect.any(Function)
				}
			])
		})

		it('should derive column metadata with currency', () => {
			const data = [
				{ name: 'John', age: 25, salary: 50000, salary_currency: 'USD' },
				{ name: 'Jane', age: 30, salary: 60000, salary_currency: 'EUR' }
			]
			const metadata = deriveColumnMetadata(data)

			expect(metadata).toEqual([
				{
					name: 'name',
					dataType: 'string',
					fields: { text: 'name' },
					formatter: expect.any(Function)
				},
				{
					name: 'age',
					dataType: 'number',
					fields: { text: 'age' },
					formatter: expect.any(Function)
				},
				{
					name: 'salary',
					dataType: 'currency',
					fields: { text: 'salary', currency: 'salary_currency' },
					formatter: expect.any(Function)
				}
			])

			expect(metadata[2].formatter(50000)).toBe('$50,000.00')
			expect(metadata[2].formatter(50000, 'EUR')).toBe('€50,000.00')
		})

		it('should add path attribute to column metadata', () => {
			const data = [
				{ route: 'Alpha', age: 90 },
				{ route: 'Alpha/Beta', age: 50 },
				{ route: 'Alpha/Beta/Gamma', age: 16 },
				{ route: 'Delta', age: 40 }
			]
			const metadata = deriveColumnMetadata(data, { path: 'route' })

			expect(metadata).toEqual([
				{
					name: 'route',
					dataType: 'string',
					path: true,
					separator: '/',
					fields: { text: 'route' },
					formatter: expect.any(Function)
				},
				{
					name: 'age',
					dataType: 'number',
					fields: { text: 'age' },
					formatter: expect.any(Function)
				}
			])
		})

		it('should add actions to the column metadata', () => {
			const data = [
				{ name: 'John', age: 25, salary: 50000 },
				{ name: 'Jane', age: 30, salary: 60000 }
			]
			const metadata = deriveColumnMetadata(data, { actions: ['edit', 'delete'] })
			expect(metadata).toEqual([
				{
					label: 'edit',
					action: 'edit'
				},
				{
					label: 'delete',
					action: 'delete'
				},
				{
					name: 'name',
					dataType: 'string',
					fields: { text: 'name' },
					formatter: expect.any(Function)
				},
				{
					name: 'age',
					dataType: 'number',
					fields: { text: 'age' },
					formatter: expect.any(Function)
				},
				{
					name: 'salary',
					dataType: 'number',
					fields: { text: 'salary' },
					formatter: expect.any(Function)
				}
			])
		})
	})

	describe('deriveHierarchy', () => {
		const data = [
			{ id: 1, route: '/fruits' },
			{ id: 2, route: '/fruits/apple' },
			{ id: 3, route: '/fruits/banana' }
		]

		it('should derive hierarchy from data', () => {
			const result = deriveHierarchy(data)
			expect(result).toEqual([
				{ depth: 0, row: data[0] },
				{ depth: 0, row: data[1] },
				{ depth: 0, row: data[2] }
			])
		})

		it('should derive hierarchy from data with a custom path', () => {
			const expected = [
				{
					depth: 0,
					isExpanded: false,
					isParent: true,
					path: '/fruits',
					value: 'fruits',
					row: data[0]
				},
				{
					depth: 1,
					children: [],
					isParent: false,
					path: '/fruits/apple',
					value: 'apple',
					row: data[1]
				},
				{
					depth: 1,
					children: [],
					isParent: false,
					path: '/fruits/banana',
					value: 'banana',
					row: data[2]
				}
			]
			expected[0].children = [expected[1], expected[2]]
			expected[1].parent = expected[0]
			expected[2].parent = expected[0]

			const result = deriveHierarchy(data, { path: 'route' })
			expect(result).toEqual(expected)
		})

		it('should derive hierarchy from data with a custom path and separator', () => {
			const input = data.map((x) => ({ ...x, route: x.route.replace(/\//g, '-').slice(1) }))

			const expected = [
				{
					depth: 0,
					isExpanded: false,
					isParent: true,
					path: 'fruits',
					value: 'fruits',
					row: input[0]
				},
				{
					depth: 1,
					children: [],
					isParent: false,
					path: 'fruits-apple',
					value: 'apple',
					row: input[1]
				},
				{
					depth: 1,
					children: [],
					isParent: false,
					path: 'fruits-banana',
					value: 'banana',
					row: input[2]
				}
			]
			expected[0].children = [expected[1], expected[2]]
			expected[1].parent = expected[0]
			expected[2].parent = expected[0]

			const result = deriveHierarchy(input, { path: 'route', separator: '-' })
			expect(result).toEqual(expected)
		})

		it('should mark all parents as expanded', () => {
			const expected = [
				{
					depth: 0,
					row: data[0],
					isExpanded: true,
					isParent: true,
					path: '/fruits',
					value: 'fruits'
				},
				{
					depth: 1,
					row: data[1],
					children: [],
					isParent: false,

					path: '/fruits/apple',
					value: 'apple'
				},
				{
					depth: 1,
					row: data[2],
					children: [],
					isParent: false,
					path: '/fruits/banana',
					value: 'banana'
				}
			]
			expected[0].children = [expected[1], expected[2]]
			expected[1].parent = expected[0]
			expected[2].parent = expected[0]

			const result = deriveHierarchy(data, { path: 'route', expanded: true })
			expect(result).toEqual(expected)
		})
	})
})
