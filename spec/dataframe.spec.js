import { describe, expect, it } from 'vitest'
import { dataframe } from '../src/dataframe'
import { data } from './fixtures/data'

describe('dataframe', () => {
	describe('create', () => {
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
	})
	describe('sort', () => {
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
		it('should sort the data frame in descending order', () => {
			const df = dataframe([...data])
			df.sortBy(['name', false])
			expect(df.select('name')).toEqual([
				{ name: 'Toyohiko Kubota' },
				{ name: 'Takehide Sato' },
				{ name: 'Simon Brunner' },
				{ name: 'Shinobi Poli' },
				{ name: 'Shaun Provost' },
				{ name: 'Ricardo de Oliviera' },
				{ name: 'Omar Zamitiz' },
				{ name: 'Myon Tuk Han' },
				{ name: 'Matias Chavez' },
				{ name: 'Markus Ertelt' },
				{ name: 'Karine Abrahim' },
				{ name: 'Heeyong Park' }
			])
		})
		it('should sort by multiple columns', () => {
			const df = dataframe([...data])
			df.sortBy('country', 'name')
			expect(df.select('country', 'name')).toEqual([
				{ country: 'Brazil', name: 'Karine Abrahim' },
				{ country: 'Brazil', name: 'Ricardo de Oliviera' },
				{ country: 'Germany', name: 'Markus Ertelt' },
				{ country: 'Germany', name: 'Simon Brunner' },
				{ country: 'Japan', name: 'Takehide Sato' },
				{ country: 'Japan', name: 'Toyohiko Kubota' },
				{ country: 'Mexico', name: 'Matias Chavez' },
				{ country: 'Mexico', name: 'Omar Zamitiz' },
				{ country: 'South Korea', name: 'Heeyong Park' },
				{ country: 'South Korea', name: 'Myon Tuk Han' },
				{ country: 'United States', name: 'Shaun Provost' },
				{ country: 'United States', name: 'Shinobi Poli' }
			])
		})
	})
	describe('select', () => {
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
	})
	describe('where', () => {
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
	describe('apply', () => {
		it('should apply a function to the data frame', () => {
			const df = dataframe(data)
			const applied = df.apply(({ name, country }) => `${name} from ${country}`)
			expect(applied).toEqual([
				'Heeyong Park from South Korea',
				'Simon Brunner from Germany',
				'Ricardo de Oliviera from Brazil',
				'Omar Zamitiz from Mexico',
				'Matias Chavez from Mexico',
				'Markus Ertelt from Germany',
				'Shaun Provost from United States',
				'Shinobi Poli from United States',
				'Takehide Sato from Japan',
				'Toyohiko Kubota from Japan',
				'Myon Tuk Han from South Korea',
				'Karine Abrahim from Brazil'
			])
			expect(df.data).toEqual(data)
		})
		it('should apply a function with a filter', () => {
			const df = dataframe(data)
			const applied = df
				.where(({ country }) => country === 'Mexico')
				.apply(({ name, country }) => `${name} from ${country}`)

			expect(applied).toEqual(['Omar Zamitiz from Mexico', 'Matias Chavez from Mexico'])
			expect(df.data).toEqual(data)
		})
	})
})
