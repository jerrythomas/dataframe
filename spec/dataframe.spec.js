import { describe, expect, it } from 'vitest'
import { dataframe } from '../src/dataframe'
import { data } from './fixtures/data'

describe('dataframe', () => {
	it('should throw error if invalid data is provided', () => {
		expect(() => dataframe()).toThrowError('data must be an array of objects')
	})
	it('should create a DataFrame', () => {
		const df = dataframe(data)

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
})
