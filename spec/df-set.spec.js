import { describe, expect, it } from 'vitest'
import { dataframe } from '../src/dataframe'

describe('dataframe -> set operations', () => {
	describe('union', () => {
		it('should perform union on similar data set', () => {
			const df1 = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			const df2 = dataframe([
				{ a: 3, b: 4 },
				{ a: 4, b: 5 }
			])
			const union = df1.union(df2)
			expect(union.data).toEqual([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 },
				{ a: 3, b: 4 },
				{ a: 4, b: 5 }
			])
			expect(union.metadata).toEqual([
				{ name: 'a', type: 'integer' },
				{ name: 'b', type: 'integer' }
			])
		})
		it('should perform union on dissimilar data set', () => {
			const df1 = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			const df2 = dataframe([{ c: 4 }, { c: 5 }])
			const union = df1.union(df2)
			expect(union.data).toEqual([{ a: 1, b: 2 }, { a: 2, b: 3 }, { c: 4 }, { c: 5 }])
			expect(union.metadata).toEqual([
				{ name: 'a', type: 'integer' },
				{ name: 'b', type: 'integer' },
				{ name: 'c', type: 'integer' }
			])
		})
		it('should throw error for mixed types', () => {
			const df1 = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			const df2 = dataframe([{ b: 'alpha' }])
			expect(() => df1.union(df2)).toThrow('Metadata conflict: b has conflicting types')
		})
	})
	describe('minus', () => {
		it('should remove common values', () => {
			const df1 = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			const df2 = dataframe([
				{ a: 2, b: 3 },
				{ a: 3, b: 4 }
			])
			const minus = df1.minus(df2)
			expect(minus.data).toEqual([{ a: 1, b: 2 }])
			expect(minus.metadata).toEqual([
				{ name: 'a', type: 'integer' },
				{ name: 'b', type: 'integer' }
			])
		})
		it('should return first set when attributes differ', () => {
			const df1 = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			const df2 = dataframe([{ c: 4 }, { c: 5 }])
			const minus = df1.minus(df2)
			expect(minus.data).toEqual([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			expect(minus.metadata).toEqual([
				{ name: 'a', type: 'integer' },
				{ name: 'b', type: 'integer' }
			])
		})
	})
	describe('intersect', () => {
		it('should return dataframe with common values', () => {
			const df1 = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			const df2 = dataframe([
				{ a: 2, b: 3 },
				{ a: 3, b: 4 }
			])
			const intersect = df1.intersect(df2)
			expect(intersect.data).toEqual([{ a: 2, b: 3 }])
			expect(intersect.metadata).toEqual([
				{ name: 'a', type: 'integer' },
				{ name: 'b', type: 'integer' }
			])
		})
		it('should return empty dataframe when attributes differ', () => {
			const df1 = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			const df2 = dataframe([{ c: 4 }, { c: 5 }])
			const intersect = df1.intersect(df2)
			expect(intersect.data).toEqual([])
			expect(intersect.metadata).toEqual([])
		})
	})
})
