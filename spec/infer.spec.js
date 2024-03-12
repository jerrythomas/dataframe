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
	deriveMetadata,
	deriveHierarchy,
	addFormatters
} from '../src/infer'

describe('infer', () => {
	describe('deriveColumns', () => {
		it('should derive column names', () => {
			expect(deriveColumns([])).toEqual([])
			expect(deriveColumns([{ name: 'alpha', rank: 1 }])).toEqual([
				{
					name: 'name',
					type: 'string',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'name' }
				},
				{
					name: 'rank',
					type: 'integer',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'rank' }
				}
			])
		})

		it('should derive column names from mixed data', () => {
			const mixedData = [
				{ name: 'alpha', rank: 1 },
				{ name: 'beta', rank: 2, score: 100 }
			]
			expect(deriveColumns(mixedData, { scanMode: 'deep' })).toEqual([
				{
					name: 'name',
					type: 'string',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'name' }
				},
				{
					name: 'rank',
					type: 'integer',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'rank' }
				},
				{
					name: 'score',
					type: 'integer',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'score' }
				}
			])
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

			expect(inferDataType([null, 2, null, 4, 5, null])).toEqual('integer')
			expect(inferDataType([null, 2.1, null, 4.2, 5.1, null])).toEqual('number')
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
			const columns = [{ name: 'name', type: 'string', fields: { text: 'name' } }]
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
					type: 'string',
					fields: { text: 'name' }
				}
			])
		})

		it('should add actions to the column metadata with action objects', () => {
			const columns = [
				{ name: 'name', type: 'string', fields: { text: 'name' } },
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
					type: 'string',
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
			expect(deriveMetadata([])).toEqual([])
		})
		it('should derive column metadata', () => {
			const data = [
				{ name: 'John', age: 25, salary: 50000.5 },
				{ name: 'Jane', age: 30, salary: 60000.5 }
			]
			const metadata = deriveMetadata(data)
			expect(metadata).toEqual([
				{
					name: 'name',
					type: 'string',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'name' },
					formatter: expect.any(Function)
				},
				{
					name: 'age',
					type: 'integer',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'age' },
					formatter: expect.any(Function)
				},
				{
					name: 'salary',
					type: 'number',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'salary' },
					formatter: expect.any(Function)
				}
			])
		})

		it('should derive column metadata with currency', () => {
			const data = [
				{ name: 'John', age: 25, salary: 50000.1, salary_currency: 'USD' },
				{ name: 'Jane', age: 30, salary: 60000.0, salary_currency: 'EUR' }
			]
			const metadata = deriveMetadata(data)

			expect(metadata).toEqual([
				{
					name: 'name',
					type: 'string',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'name' },
					formatter: expect.any(Function)
				},
				{
					name: 'age',
					type: 'integer',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'age' },
					formatter: expect.any(Function)
				},
				{
					name: 'salary',
					type: 'currency',
					sortable: true,
					filterable: true,
					sorted: 'none',
					digits: 2,
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
			const metadata = deriveMetadata(data, { path: 'route' })

			expect(metadata).toEqual([
				{
					name: 'route',
					type: 'string',
					sortable: true,
					filterable: true,
					sorted: 'none',
					path: true,
					separator: '/',
					fields: { text: 'route' },
					formatter: expect.any(Function)
				},
				{
					name: 'age',
					type: 'integer',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'age' },
					formatter: expect.any(Function)
				}
			])
		})

		it('should add actions to the column metadata', () => {
			const data = [
				{ name: 'John', age: 25, salary: 50000.5 },
				{ name: 'Jane', age: 30, salary: 60000.0 }
			]
			const metadata = deriveMetadata(data, { actions: ['edit', 'delete'] })
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
					type: 'string',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'name' },
					formatter: expect.any(Function)
				},
				{
					name: 'age',
					type: 'integer',
					sortable: true,
					filterable: true,
					sorted: 'none',
					fields: { text: 'age' },
					formatter: expect.any(Function)
				},
				{
					name: 'salary',
					type: 'number',
					sortable: true,
					filterable: true,
					sorted: 'none',
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
					depth: 1,
					isExpanded: false,
					isParent: true,
					path: '/fruits',
					value: 'fruits',
					row: data[0]
				},
				{
					depth: 2,
					children: [],
					isParent: false,
					path: '/fruits/apple',
					value: 'apple',
					row: data[1]
				},
				{
					depth: 2,
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
					depth: 1,
					isExpanded: false,
					isParent: true,
					path: 'fruits',
					value: 'fruits',
					row: input[0]
				},
				{
					depth: 2,
					children: [],
					isParent: false,
					path: 'fruits-apple',
					value: 'apple',
					row: input[1]
				},
				{
					depth: 2,
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
					depth: 1,
					row: data[0],
					isExpanded: true,
					isParent: true,
					path: '/fruits',
					value: 'fruits'
				},
				{
					depth: 2,
					row: data[1],
					children: [],
					isParent: false,

					path: '/fruits/apple',
					value: 'apple'
				},
				{
					depth: 2,
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

	describe('addFormatters', () => {
		it('should use default digits for numbers', () => {
			const metadata = [
				{ name: 'age', type: 'integer' },
				{ name: 'weight', type: 'number' },
				{ name: 'salary', type: 'currency' }
			]
			const result = addFormatters(metadata)
			expect(result[0].formatter(1)).toEqual('1')
			expect(result[1].formatter(2.3)).toEqual('2.30')
			expect(result[2].formatter(1.2)).toEqual('$1.20')
		})
	})
})
