import { describe, expect, it } from 'vitest'
import { dataframe } from '../src/dataframe'

describe('dataframe -> alter structure', () => {
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
})
