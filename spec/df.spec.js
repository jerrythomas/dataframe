import { describe, expect, it } from 'vitest'
import { dataframe, isDataFrame } from '../src/df'
import { data } from './fixtures/data'

describe('df', () => {
	describe('isDataFrame', () => {
		it('should return true for a DataFrame', () => {
			const df = dataframe([])
			expect(isDataFrame(df)).toBe(true)
		})

		it('should return false for an object that is not a DataFrame', () => {
			expect(isDataFrame({})).toBe(false)
			expect(isDataFrame(null)).toBe(false)
			expect(isDataFrame([])).toBe(false)
			expect(isDataFrame('')).toBe(false)
			expect(isDataFrame(0)).toBe(false)
			expect(isDataFrame(true)).toBe(false)
		})
	})

	describe('dataframe', () => {
		it('should throw error if invalid data is provided', () => {
			expect(() => dataframe()).toThrowError('data must be an array of objects')
		})
		it('should create a DataFrame', () => {
			const df = dataframe(data)
			expect(isDataFrame(df)).toBe(true)
			expect(df.data).toEqual(data)
			expect(df.columns).toEqual({
				age: { name: 'age', type: 'integer' },
				country: { name: 'country', type: 'string' },
				level: { name: 'level', type: 'integer' },
				name: { name: 'name', type: 'string' },
				rank: { name: 'rank', type: 'integer' },
				score: { name: 'score', type: 'integer' },
				time: { name: 'time', type: 'integer' }
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

		it('should join two data sets', () => {
			const table1 = [
				{ id: 1, name: 'John' },
				{ id: 2, name: 'Jane' },
				{ id: 3, name: 'Alice' },
				{ id: 4, name: 'Bob' }
			]
			const table2 = [
				{ id: 1, age: 20 },
				{ id: 2, age: 25 },
				{ id: 3, age: 30 },
				{ id: 4, age: 35 }
			]
			const df1 = dataframe(table1)
			const df2 = dataframe(table2)

			const query = (x, y) => x.id === y.id
			let joined = df1.join(df2, query)
			expect(joined.data).toEqual([
				{ id: 1, name: 'John', age: 20 },
				{ id: 2, name: 'Jane', age: 25 },
				{ id: 3, name: 'Alice', age: 30 },
				{ id: 4, name: 'Bob', age: 35 }
			])
			expect(df1.data).toEqual(table1)
			expect(df2.data).toEqual(table2)

			joined = df1.join(table2, query)
			expect(joined.data).toEqual([
				{ id: 1, name: 'John', age: 20 },
				{ id: 2, name: 'Jane', age: 25 },
				{ id: 3, name: 'Alice', age: 30 },
				{ id: 4, name: 'Bob', age: 35 }
			])
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
