import { describe, expect, it } from 'vitest'
import { dataframe } from '../src/dataframe'
import fixture from './fixtures/nba'
import { max, mean, sum, quantile } from 'd3-array'
import groupData from './fixtures/rollup'
import { counter, violin } from '../src/aggregators'

describe('dataframe -> rollup', () => {
	it('should throw error if group_by is not specified', () => {
		const df = dataframe([
			{ a: 1, b: 2 },
			{ a: 2, b: 3 }
		])
		expect(() => df.rollup()).toThrow(
			'Use groupBy to specify the columns to group by or use summarize to add aggregators.'
		)
	})

	it('should aggregate without group by', () => {
		const df = dataframe(groupData.simple)
		const grouped = df.summarize('country', { count: counter }).rollup()
		expect(grouped.data).toEqual([{ count: 12 }])
		expect(grouped.metadata).toEqual([
			{
				name: 'count',
				type: 'integer'
			}
		])
	})

	it('should group by a column', () => {
		const df = dataframe(groupData.simple)
		const grouped = df.groupBy('country').summarize('name', 'children').rollup()
		expect(grouped.data).toEqual(groupData.list_by_country)
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
		const df = dataframe(groupData.airports)
		const grouped = df.groupBy('country', 'state').rollup()

		expect(grouped.data).toEqual(groupData.list_by_country_state)
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

	it('should rollup counts grouping by country', () => {
		const df = dataframe(groupData.airports)
		const grouped = df.groupBy('country').summarize(['name'], { count: counter }).rollup()
		expect(grouped.data).toEqual(groupData.count_by_country)
		expect(grouped.metadata).toEqual([
			{ name: 'country', type: 'string' },
			{ name: 'count', type: 'integer' }
		])
	})

	it('should rollup counts grouping by country and state', () => {
		const df = dataframe(groupData.airports)
		const grouped = df.groupBy('country', 'state').summarize('name', { count: counter }).rollup()
		expect(grouped.data).toEqual(groupData.count_by_country_state)
		expect(grouped.metadata).toEqual([
			{ name: 'country', type: 'string' },
			{ name: 'state', type: 'string' },
			{ name: 'count', type: 'integer' }
		])
	})

	it('should rollup using multiple aggregations', () => {
		const df = dataframe(groupData.items)
		const mapper = (row) => row.price * row.quantity
		const grouped = df
			.groupBy('category')
			.summarize(mapper, {
				avg_cost: mean,
				cost_q1: (v) => quantile(v, 0.25),
				cost_q3: (v) => quantile(v, 0.75)
			})
			.rollup()
		expect(grouped.data).toEqual(groupData.cost_by_category)
		expect(grouped.metadata).toEqual([
			{ name: 'category', type: 'string' },
			{ name: 'avg_cost', type: 'number' },
			{ name: 'cost_q1', type: 'number' },
			{ name: 'cost_q3', type: 'number' }
		])
	})

	it('should rollup and update', () => {
		const df = dataframe(groupData.items)
		const mapper = (row) => row.price * row.quantity
		const result = df
			.groupBy('category')
			.summarize(mapper, {
				avg_cost: mean,
				q1: (v) => quantile(v, 0.25),
				q3: (v) => quantile(v, 0.75)
			})
			.rollup()
			.apply(violin)

		expect(result).toEqual([
			{
				avg_cost: 14.333333333333334,
				category: 'food',
				iqr: 2,
				q1: 13.5,
				q3: 15.5,
				qr_max: 16.5,
				qr_min: 10.5
			},
			{
				avg_cost: 37.5,
				category: 'drink',
				iqr: 7.5,
				q1: 33.75,
				q3: 41.25,
				qr_max: 45,
				qr_min: 22.5
			}
		])
	})

	it('should align subgroups during rollup', () => {
		const result = dataframe(groupData.data).groupBy('date').align('team').rollup()
		expect(result.data).toEqual(groupData.with_align)
	})

	it('should align subgroups using template during rollup', () => {
		const result = dataframe(groupData.data)
			.groupBy('date')
			.align('team')
			.using({ score: 0, pct: 0, rank: 999 })
			.rollup()
		expect(result.data).toEqual(groupData.align_using)
	})

	it('should calculate team max scores', () => {
		let result = dataframe(fixture.nba)
			.groupBy('team')
			.summarize((d) => d.score, { score: max })
			.rollup()

		expect(result.data).toEqual(fixture.team_score)
	})

	it('should calculate group, team max scores', () => {
		const result = dataframe(fixture.nba)
			.groupBy('group')
			.summarize((d) => d.score, { score: max })
			.rollup()
		expect(result.data).toEqual(fixture.group_score)
	})

	it('should calculate team total scores', () => {
		const result = dataframe(fixture.nba)
			.sortBy('group', 'team')
			.groupBy('group', 'team')
			.summarize((d) => d.score, { score: sum })
			.rollup()

		expect(result.data).toEqual(fixture.group_team_score)
	})
	it('should calculate team average pct', () => {
		const result = dataframe(fixture.nba)
			.groupBy('group', 'team')
			.summarize((d) => d.pct, { pct: mean })
			.rollup()
		expect(result.data).toEqual(fixture.group_team_pct)
	})

	// it('should create nested arrays', () => {
	// 	let result = dataframe().rollup('score').group(['team']).key('date').transform(fixture.nba)
	// 	expect(result).toEqual(fixture.date_team_score)

	// 	result = dataframe().rollup('score').group(['group', 'team']).key('date').transform(fixture.nba)
	// 	expect(result).toEqual(fixture.date_group_team_score)
	// })
})
