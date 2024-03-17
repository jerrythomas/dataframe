import { describe, expect, it } from 'vitest'
import { dataframe, isDataFrame } from '../src/df'
import { data } from './fixtures/data'
import joindata from './fixtures/join'
import { writeFileSync } from 'fs'

describe('df', () => {
	// describe('isDataFrame', () => {
	// 	it('should return true for a DataFrame', () => {
	// 		const df = dataframe([])
	// 		expect(isDataFrame(df)).toBe(true)
	// 	})

	// 	it('should return false for an object that is not a DataFrame', () => {
	// 		expect(isDataFrame({})).toBe(false)
	// 		expect(isDataFrame(null)).toBe(false)
	// 		expect(isDataFrame([])).toBe(false)
	// 		expect(isDataFrame('')).toBe(false)
	// 		expect(isDataFrame(0)).toBe(false)
	// 		expect(isDataFrame(true)).toBe(false)
	// 	})
	// })

	describe('dataframe', () => {
		const child = [
			{ id: 1, parentId: 1 },
			{ id: 2, parentId: 1 },
			{ id: 3, parentId: 2 }
		]

		const parent = [{ id: 1 }, { id: 2 }, { id: 3 }]
		it('should throw error if invalid data is provided', () => {
			expect(() => dataframe()).toThrowError('data must be an array of objects')
		})
		it('should create a DataFrame', () => {
			const df = dataframe(data)
			// expect(isDataFrame(df)).toBe(true)
			expect(df.data).toEqual(data)
			expect(df.columns).toEqual({
				age: 2,
				country: 0,
				level: 6,
				name: 1,
				rank: 5,
				score: 3,
				time: 4
			})
			expect(df.metadata).toEqual([
				{ name: 'country', type: 'string' },
				{ name: 'name', type: 'string' },
				{ name: 'age', type: 'integer' },
				{ name: 'score', type: 'integer' },
				{ name: 'time', type: 'integer' },
				{ name: 'rank', type: 'integer' },
				{ name: 'level', type: 'integer' }
			])
		})

		it('should sort the data frame', () => {
			const df = dataframe([...data])
			df.sortBy('name')
			expect(df.data.map(({ name }) => name)).toEqual([
				'Heeyong Park',
				'Karine Abrahim',
				'Markus Ertelt',
				'Matias Chavez',
				'Myon Tuk Han',
				'Omar Zamitiz',
				'Ricardo de Oliviera',
				'Shaun Provost',
				'Shinobi Poli',
				'Simon Brunner',
				'Takehide Sato',
				'Toyohiko Kubota'
			])
		})

		it('should select specific columns', () => {
			const df = dataframe([...data])
			const selected = df.select('name', 'country')
			expect(selected).toEqual([
				{ name: 'Heeyong Park', country: 'South Korea' },
				{ name: 'Simon Brunner', country: 'Germany' },
				{ name: 'Ricardo de Oliviera', country: 'Brazil' },
				{ name: 'Omar Zamitiz', country: 'Mexico' },
				{ name: 'Matias Chavez', country: 'Mexico' },
				{ name: 'Markus Ertelt', country: 'Germany' },
				{ name: 'Shaun Provost', country: 'United States' },
				{ name: 'Shinobi Poli', country: 'United States' },
				{ name: 'Takehide Sato', country: 'Japan' },
				{ name: 'Toyohiko Kubota', country: 'Japan' },
				{ name: 'Myon Tuk Han', country: 'South Korea' },
				{ name: 'Karine Abrahim', country: 'Brazil' }
			])
			expect(df.data).toEqual(data)
		})
		it('should select original columns if none provided', () => {
			const df = dataframe([...data])
			const selected = df.select()
			expect(selected).toEqual(data)
		})

		it('should filter the data frame', () => {
			const df = dataframe([...data])
			const filtered = df.where(({ country }) => country === 'Mexico').select('name', 'country')
			expect(filtered).toEqual([
				{
					country: 'Mexico',
					name: 'Omar Zamitiz'
				},
				{
					country: 'Mexico',
					name: 'Matias Chavez'
				}
			])
			expect(df.data).toEqual(data)
		})

		describe('join', () => {
			const child = dataframe(joindata.ships)
			const parent = dataframe(joindata.groups)
			const matcher = (child, parent) => child.group_id === parent.id

			it('should perform inner join', () => {
				let inner = child.join(parent, matcher)
				expect(inner.data).toEqual(joindata.inner.no_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
				expect(inner.metadata).toEqual([
					{ name: 'id', type: 'integer' },
					{ name: 'name', type: 'string' },
					{ name: 'group_id', type: 'integer' },
					{ name: 'class', type: 'string' }
				])

				inner = child.join(parent, matcher, { type: 'inner' })
				expect(inner.data).toEqual(joindata.inner.no_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)

				inner = child.innerJoin(parent, matcher)
				expect(inner.data).toEqual(joindata.inner.no_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
			})

			it('should perform inner join renaming second', () => {
				let inner = child.join(parent, matcher, { right: { prefix: 'group' } })
				expect(inner.data).toEqual(joindata.inner.with_y_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)

				expect(inner.metadata).toEqual([
					{ name: 'id', type: 'integer' },
					{ name: 'name', type: 'string' },
					{ name: 'group_id', type: 'integer' },
					{ name: 'group_class', type: 'string' }
				])
			})

			it('should perform inner join renaming first', () => {
				let inner = child.join(parent, matcher, { left: { prefix: 'x' } })
				expect(inner.data).toEqual(joindata.inner.with_x_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)

				expect(inner.metadata).toEqual([
					{ name: 'x_id', type: 'integer' },
					{ name: 'x_name', type: 'string' },
					{ name: 'x_group_id', type: 'integer' },
					{ name: 'id', type: 'integer' },
					{ name: 'class', type: 'string' }
				])
			})

			it('should perform inner join renaming both', () => {
				let inner = child.join(parent, matcher, { left: { prefix: 'x' }, right: { prefix: 'y' } })
				expect(inner.data).toEqual(joindata.inner.both_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
				expect(inner.metadata).toEqual([
					{ name: 'x_id', type: 'integer' },
					{ name: 'x_name', type: 'string' },
					{ name: 'x_group_id', type: 'integer' },
					{ name: 'y_id', type: 'integer' },
					{ name: 'y_class', type: 'string' }
				])
			})

			it('should perform outer join', () => {
				let outer = child.join(parent, matcher, { type: 'outer' })
				expect(outer.data).toEqual(joindata.outer.no_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
				expect(outer.metadata).toEqual([
					{ name: 'id', type: 'integer' },
					{ name: 'name', type: 'string' },
					{ name: 'group_id', type: 'integer' },
					{ name: 'class', type: 'string' }
				])

				outer = child.outerJoin(parent, matcher)
				expect(outer.data).toEqual(joindata.outer.no_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
			})

			it('should perform outer join renaming second', () => {
				let outer = child.join(parent, matcher, { type: 'outer', right: { prefix: 'y' } })
				expect(outer.data).toEqual(joindata.outer.y_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
				expect(outer.metadata).toEqual([
					{ name: 'id', type: 'integer' },
					{ name: 'name', type: 'string' },
					{ name: 'group_id', type: 'integer' },
					{ name: 'y_id', type: 'integer' },
					{ name: 'y_class', type: 'string' }
				])
			})

			it('should perform outer join renaming first', () => {
				let outer = child.join(parent, matcher, { type: 'outer', left: { prefix: 'x' } })
				expect(outer.data).toEqual(joindata.outer.x_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
				expect(outer.metadata).toEqual([
					{ name: 'x_id', type: 'integer' },
					{ name: 'x_name', type: 'string' },
					{ name: 'x_group_id', type: 'integer' },
					{ name: 'id', type: 'integer' },
					{ name: 'class', type: 'string' }
				])
			})

			it('should perform outer join renaming both', () => {
				let outer = child.join(parent, matcher, {
					type: 'outer',
					left: { prefix: 'x' },
					right: { prefix: 'y' }
				})
				expect(outer.data).toEqual(joindata.outer.both_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
				expect(outer.metadata).toEqual([
					{ name: 'x_id', type: 'integer' },
					{ name: 'x_name', type: 'string' },
					{ name: 'x_group_id', type: 'integer' },
					{ name: 'y_id', type: 'integer' },
					{ name: 'y_class', type: 'string' }
				])
			})
			it('should perform full join', () => {
				let outer = child.join(parent, matcher, { type: 'full' })
				expect(outer.data).toEqual(joindata.full.no_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
				expect(outer.metadata).toEqual([
					{ name: 'id', type: 'integer' },
					{ name: 'name', type: 'string' },
					{ name: 'group_id', type: 'integer' },
					{ name: 'class', type: 'string' }
				])

				outer = child.fullJoin(parent, matcher)
				expect(outer.data).toEqual(joindata.full.no_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
			})
			it('should perform full join renaming right', () => {
				let outer = child.join(parent, matcher, { type: 'full', right: { prefix: 'y' } })
				expect(outer.data).toEqual(joindata.full.y_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
				expect(outer.metadata).toEqual([
					{ name: 'id', type: 'integer' },
					{ name: 'name', type: 'string' },
					{ name: 'group_id', type: 'integer' },
					{ name: 'y_id', type: 'integer' },
					{ name: 'y_class', type: 'string' }
				])
			})
			it('should perform full join renaming left', () => {
				let outer = child.join(parent, matcher, { type: 'full', left: { prefix: 'x' } })
				expect(outer.data).toEqual(joindata.full.x_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
				expect(outer.metadata).toEqual([
					{ name: 'x_id', type: 'integer' },
					{ name: 'x_name', type: 'string' },
					{ name: 'x_group_id', type: 'integer' },
					{ name: 'id', type: 'integer' },
					{ name: 'class', type: 'string' }
				])
			})

			it('should perform full join renaming both', () => {
				let outer = child.join(parent, matcher, {
					type: 'full',
					left: { prefix: 'x' },
					right: { prefix: 'y' }
				})
				expect(outer.data).toEqual(joindata.full.both_rename)
				expect(parent.data).toEqual(joindata.groups)
				expect(child.data).toEqual(joindata.ships)
				expect(outer.metadata).toEqual([
					{ name: 'x_id', type: 'integer' },
					{ name: 'x_name', type: 'string' },
					{ name: 'x_group_id', type: 'integer' },
					{ name: 'y_id', type: 'integer' },
					{ name: 'y_class', type: 'string' }
				])
			})
		})

		it('should join generating a nested dataframe', () => {
			const childDF = dataframe(child)
			const parentDF = dataframe(parent)
			const using = (x, y) => x.parentId === y.id

			const expected = [
				{
					id: 1,
					children: [
						{ id: 1, parentId: 1 },
						{ id: 2, parentId: 1 }
					]
				},
				{ id: 2, children: [{ id: 3, parentId: 2 }] },
				{ id: 3, children: [] }
			]

			let nested = childDF.nestedJoin(parentDF, using)
			expect(nested.data).toEqual(expected)
			expect(nested.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{
					name: 'children',
					type: 'array',
					metadata: [
						{
							name: 'id',
							type: 'integer'
						},
						{ name: 'parentId', type: 'integer' }
					]
				}
			])
			expect(nested.columns).toEqual({
				id: 0,
				children: 1
			})
			expect(parentDF.data).toEqual(parent)
			expect(childDF.data).toEqual(child)
		})
		// it('should group by a column', () => {
		// 	const df = dataframe([...data])
		// 	const grouped = df.groupBy('country', { include: ['name'] })
		// 	expect(grouped.data).toEqual([
		// 		{
		// 			country: 'South Korea',
		// 			children: [{ name: 'Heeyong Park' }, { name: 'Myon Tuk Han' }]
		// 		},
		// 		{
		// 			country: 'Germany',
		// 			children: [{ name: 'Simon Brunner' }, { name: 'Markus Ertelt' }]
		// 		},
		// 		{
		// 			country: 'Brazil',
		// 			children: [{ name: 'Ricardo de Oliviera' }, { name: 'Karine Abrahim' }]
		// 		},
		// 		{
		// 			country: 'Mexico',
		// 			children: [{ name: 'Omar Zamitiz' }, { name: 'Matias Chavez' }]
		// 		},
		// 		{
		// 			country: 'United States',
		// 			children: [{ name: 'Shaun Provost' }, { name: 'Shinobi Poli' }]
		// 		},
		// 		{
		// 			country: 'Japan',
		// 			children: [{ name: 'Takehide Sato' }, { name: 'Toyohiko Kubota' }]
		// 		}
		// 	])
		// })
	})
})
