import { describe, expect, it } from 'vitest'
import { dataframe } from '../src/df'
import fixture from './fixtures/group'
import { counter, getAggregator } from '../src/aggregators'
import { mean, quantile } from 'd3-array'

describe('structure', () => {
	describe('rename', () => {
		const data = [{ country: 'USA', name: 'Bob' }]

		it('should throw error for non-existing columns', () => {
			const df = dataframe(data)
			expect(() => df.rename({ age: 'years' })).toThrow(
				'Cannot rename non-existing column(s) [age].'
			)
		})

		it('should throw error when renamed column exists', () => {
			const df = dataframe(data)
			expect(() => df.rename({ country: 'name' })).toThrow(
				'Cannot rename to an existing column. [name]'
			)
		})
		it('should rename columns', () => {
			const df = dataframe(data)
			const renamed = df.rename({ country: 'nation' })
			expect(renamed.metadata).toEqual([
				{ name: 'nation', type: 'string' },
				{ name: 'name', type: 'string' }
			])
			expect(renamed.columns).toEqual({ nation: 0, name: 1 })
			expect(renamed.data).toEqual([{ nation: 'USA', name: 'Bob' }])
			expect(renamed.data).not.toBe(df.data)
		})
	})

	describe('drop', () => {
		it('should drop column', () => {
			const df = dataframe([{ a: 1, b: 2 }])
			const dropped = df.drop('a')
			expect(dropped.metadata).toEqual([{ name: 'b', type: 'integer' }])
			expect(dropped.columns).toEqual({ b: 0 })
			expect(dropped.data).toEqual([{ b: 2 }])
			expect(dropped.data).not.toBe(df.data)
		})

		it('should drop multiple columns', () => {
			const df = dataframe([{ a: 1, b: 2, c: 3 }])
			const dropped = df.drop('a', 'c')
			expect(dropped.metadata).toEqual([{ name: 'b', type: 'integer' }])
			expect(dropped.columns).toEqual({ b: 0 })
			expect(dropped.data).toEqual([{ b: 2 }])
			expect(dropped.data).not.toBe(df.data)
		})
	})

	describe('summarize', () => {
		it('should throw error if not grouping or summary columns are provided', () => {
			const df = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			expect(() => df.summarize()).toThrow(
				'Summary requires at least one group column or aggregation'
			)
		})

		it('should group by a column', () => {
			const df = dataframe(fixture.simple)
			const grouped = df.groupBy('country').summarize()
			expect(grouped.data).toEqual(fixture.list_by_country)
			expect(grouped.metadata).toEqual([
				{ name: 'country', type: 'string' },
				{
					name: 'children',
					type: 'array',
					metadata: [{ name: 'name', type: 'string' }]
				}
			])
		})

		it('should group by multiple columns', () => {
			const df = dataframe(fixture.airports)
			const grouped = df.groupBy('country', 'state').summarize()
			expect(grouped.data).toEqual(fixture.list_by_country_state)
			expect(grouped.metadata).toEqual([
				{ name: 'country', type: 'string' },
				{ name: 'state', type: 'string' },
				{
					name: 'children',
					type: 'array',
					metadata: [
						{ name: 'city', type: 'string' },
						{ name: 'name', type: 'string' }
					]
				}
			])
		})

		it('should summarize counts grouping by country', () => {
			const df = dataframe(fixture.airports)
			const operators = [{ name: 'count', ...getAggregator(['name'], counter) }]
			const grouped = df.groupBy('country').summarize(operators)
			expect(grouped.data).toEqual(fixture.count_by_country)
			expect(grouped.metadata).toEqual([
				{ name: 'country', type: 'string' },
				{ name: 'count', type: 'integer' }
			])
		})

		it('should summarize counts grouping by country and state', () => {
			const df = dataframe(fixture.airports)
			const operators = [{ name: 'count', ...getAggregator(['name'], counter) }]
			const grouped = df.groupBy('country', 'state').summarize(operators)
			expect(grouped.data).toEqual(fixture.count_by_country_state)
			expect(grouped.metadata).toEqual([
				{ name: 'country', type: 'string' },
				{ name: 'state', type: 'string' },
				{ name: 'count', type: 'integer' }
			])
		})

		it('should summarize using custom aggregations', () => {
			const df = dataframe(fixture.items)
			const operators = [
				{ name: 'avg_cost', mapper: (row) => row.price * row.quantity, reducer: mean },
				{
					name: 'cost_q1',
					mapper: (row) => row.price * row.quantity,
					reducer: (v) => quantile(v, 0.25)
				},
				{
					name: 'cost_q3',
					mapper: (row) => row.price * row.quantity,
					reducer: (v) => quantile(v, 0.75)
				}
			]
			const grouped = df.groupBy('category').summarize(operators)
			expect(grouped.data).toEqual(fixture.cost_by_category)
			expect(grouped.metadata).toEqual([
				{ name: 'category', type: 'string' },
				{ name: 'avg_cost', type: 'number' },
				{ name: 'cost_q1', type: 'number' },
				{ name: 'cost_q3', type: 'number' }
			])
		})
	})
})