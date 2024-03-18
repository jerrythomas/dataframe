import { describe, expect, it } from 'vitest'
import { dataframe } from '../src/df'

describe('crud operations', () => {
	describe('update', () => {
		it('should throw error when input is not object', () => {
			const df = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			expect(() => df.update('a')).toThrow('value must be an object')
		})
		it('should update a record', () => {
			const df = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])
			const updated = df.update({ a: 'x' })
			expect(updated.data).toEqual([
				{ a: 'x', b: 2 },
				{ a: 'x', b: 3 }
			])
			expect(updated).toEqual(df)
			expect(updated.metadata).toEqual([
				{ name: 'a', type: 'string' },
				{ name: 'b', type: 'integer' }
			])
			expect(updated.columns).toEqual({ a: 0, b: 1 })
		})

		it('should update a record with multiple attributes', () => {
			const df = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 }
			])

			const updated = df.update({ c: 2, y: 4 })
			expect(updated.data).toEqual([
				{ a: 1, b: 2, c: 2, y: 4 },
				{ a: 2, b: 3, c: 2, y: 4 }
			])
			expect(updated).toEqual(df)
			expect(updated.metadata).toEqual([
				{ name: 'a', type: 'integer' },
				{ name: 'b', type: 'integer' },
				{ name: 'c', type: 'integer' },
				{ name: 'y', type: 'integer' }
			])
			expect(updated.columns).toEqual({ a: 0, b: 1, c: 2, y: 3 })
		})

		it('should update selected rows only', () => {
			const df = dataframe([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 },
				{ a: 3, b: 4 }
			])
			const matcher = (row) => row.a === 2
			const updated = df.where(matcher).update({ a: 9 })
			expect(df.filter).toBeNull()
			expect(updated.data).toEqual([
				{ a: 1, b: 2 },
				{ a: 9, b: 3 },
				{ a: 3, b: 4 }
			])
			expect(updated).toEqual(df)
			expect(updated.metadata).toEqual([
				{ name: 'a', type: 'integer' },
				{ name: 'b', type: 'integer' }
			])
			expect(updated.columns).toEqual({ a: 0, b: 1 })
		})
	})

	describe('delete', () => {
		it('should delete all rows', () => {
			const data = [
				{ a: 1, b: 2 },
				{ a: 9, b: 3 },
				{ a: 3, b: 4 }
			]
			const df = dataframe(data)
			const deleted = df.delete()
			expect(deleted.data).toEqual([])
			expect(deleted).toEqual(df)
			expect(deleted.metadata).toEqual([
				{ name: 'a', type: 'integer' },
				{ name: 'b', type: 'integer' }
			])
			expect(deleted.columns).toEqual({ a: 0, b: 1 })
			expect(data.length).toBe(0)
		})

		it('should delete selected rows', () => {
			const data = [
				{ a: 1, b: 2 },
				{ a: 9, b: 3 },
				{ a: 3, b: 4 }
			]
			const df = dataframe(data)
			const matcher = (row) => row.a === 9
			const deleted = df.where(matcher).delete()
			expect(deleted.data).toEqual([
				{ a: 1, b: 2 },
				{ a: 3, b: 4 }
			])
			expect(deleted).toEqual(df)
			expect(deleted.metadata).toEqual([
				{ name: 'a', type: 'integer' },
				{ name: 'b', type: 'integer' }
			])
			expect(deleted.columns).toEqual({ a: 0, b: 1 })
			expect(data.length).toBe(2)
		})
	})
})
