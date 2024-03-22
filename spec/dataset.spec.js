import { describe, expect, it } from 'vitest'
import { dataset } from '../src/dataset'
import { renamer } from '../src/renamer'

describe('dataset', () => {
	it('should return an object with methods', () => {
		const ds = dataset([])
		expect(ds).toEqual({
			get: expect.any(Function),
			union: expect.any(Function),
			intersect: expect.any(Function),
			difference: expect.any(Function),
			rename: expect.any(Function)
			// join: expect.any(Function),
			// leftJoin: expect.any(Function),
			// rightJoin: expect.any(Function),
			// fullJoin: expect.any(Function),
			// crossJoin: expect.any(Function),
			// semiJoin: expect.any(Function),
			// antiJoin: expect.any(Function),
			// nestedJoin: expect.any(Function)
		})
	})
	it('should perform union operation', () => {
		let result = dataset([1, 2, 3]).union([4, 5, 6]).get()
		expect(result).toEqual([1, 2, 3, 4, 5, 6])
		result = dataset([{ a: 1 }, { a: 2 }])
			.union([{ a: 3 }, { a: 4 }])
			.get()
		expect(result).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }])
	})
	it('should perform intersect operation', () => {
		let result = dataset([1, 2, 3]).intersect([2, 3, 4]).get()
		expect(result).toEqual([2, 3])
		result = dataset([{ a: 1 }, { a: 2 }])
			.intersect([{ a: 2 }, { a: 3 }])
			.get()
		expect(result).toEqual([{ a: 2 }])
	})
	it('should perform difference operation', () => {
		let result = dataset([1, 2, 3]).difference([2, 3, 4]).get()
		expect(result).toEqual([1])
		result = dataset([{ a: 1 }, { a: 2 }])
			.difference([{ a: 2 }, { a: 3 }])
			.get()
		expect(result).toEqual([{ a: 1 }])
	})

	it('should perform rename operation', () => {
		let result = dataset([{ a: 1 }, { a: 2 }])
			.rename(renamer({ prefix: 'x', keys: ['a'] }).get().renameObject)
			.get()
		expect(result).toEqual([{ x_a: 1 }, { x_a: 2 }])
	})
})
