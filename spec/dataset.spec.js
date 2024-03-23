import { describe, expect, it } from 'vitest'
import { dataset } from '../src/dataset'
import { renamer } from '../src/renamer'
import joindata from './fixtures/join'

describe('dataset', () => {
	it('should return an object with methods', () => {
		const ds = dataset([])
		expect(ds).toEqual({
			where: expect.any(Function),
			select: expect.any(Function),
			union: expect.any(Function),
			intersect: expect.any(Function),
			difference: expect.any(Function),
			rename: expect.any(Function),
			innerJoin: expect.any(Function),
			leftJoin: expect.any(Function),
			rightJoin: expect.any(Function),
			fullJoin: expect.any(Function),
			crossJoin: expect.any(Function),
			semiJoin: expect.any(Function),
			antiJoin: expect.any(Function),
			nestedJoin: expect.any(Function)
		})
	})
	describe('select', () => {
		it('should return the data', () => {
			const result = dataset(joindata.groups).select()
			expect(result).toEqual(joindata.groups)
		})
		it('should return the data with selected fields', () => {
			const result = dataset(joindata.ships).select('id', 'name')
			expect(result).toEqual([
				{ id: 10, name: 'Enterprise' },
				{ id: 20, name: "D'Kyr" },
				{ id: 30, name: 'Voyager' },
				{ id: 40, name: 'Narada' },
				{ id: 50, name: 'Bird of Prey' },
				{ id: 60, name: 'Scimitar' }
			])
		})
	})

	describe('where', () => {
		it('should return filtered data', () => {
			const result = dataset(joindata.ships)
				.where((ship) => ship.id > 30)
				.select()
			expect(result).toEqual([
				{ id: 40, name: 'Narada', group_id: 2 },
				{ id: 50, name: 'Bird of Prey' },
				{ id: 60, name: 'Scimitar' }
			])
		})
		it('should return filtered data with selected fields', () => {
			const result = dataset(joindata.ships)
				.where((ship) => ship.id > 30)
				.select('name')
			expect(result).toEqual([{ name: 'Narada' }, { name: 'Bird of Prey' }, { name: 'Scimitar' }])
		})
	})

	describe('set operations', () => {
		it('should perform union operation', () => {
			const result = dataset([{ a: 1 }, { a: 2 }])
				.union([{ a: 3 }, { a: 4 }])
				.select()
			expect(result).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }])
		})
		it('should perform intersect operation', () => {
			const result = dataset([{ a: 1 }, { a: 2 }])
				.intersect([{ a: 2 }, { a: 3 }])
				.select()
			expect(result).toEqual([{ a: 2 }])
		})
		it('should perform difference operation', () => {
			const result = dataset([{ a: 1 }, { a: 2 }])
				.difference([{ a: 2 }, { a: 3 }])
				.select()
			expect(result).toEqual([{ a: 1 }])
		})
	})

	describe('rename', () => {
		it('should perform rename using function', () => {
			const { renameObject } = renamer({ prefix: 'x', keys: ['a'] }).get()
			const result = dataset([{ a: 1 }, { a: 2 }])
				.rename(renameObject)
				.select()
			expect(result).toEqual([{ x_a: 1 }, { x_a: 2 }])
		})
		it('should perform rename using a key map', () => {
			const result = dataset([{ a: 1, c: 3 }, { a: 2 }])
				.rename({ a: 'b' })
				.select()
			expect(result).toEqual([{ b: 1, c: 3 }, { b: 2 }])
		})
	})

	describe('joins', () => {
		const child = dataset([...joindata.ships])
		const parent = dataset([...joindata.groups])
		const matcher = (child, parent) => child.group_id === parent.group_id

		it('should perform inner join', () => {
			const result = child.innerJoin(parent, matcher)
			expect(result.select()).toEqual(joindata.inner.no_rename)
			expect(result).not.toEqual(child)
			expect(result).not.toEqual(parent)
		})
		it('should perform left join', () => {
			const result = child.leftJoin(parent, matcher)
			expect(result.select()).toEqual(joindata.left.no_rename)
			expect(result).not.toEqual(child)
			expect(result).not.toEqual(parent)
		})
		it('should perform right join', () => {
			const result = child.rightJoin(parent, matcher)
			expect(result.select()).toEqual(joindata.right.no_rename)
			expect(result).not.toEqual(child)
			expect(result).not.toEqual(parent)
		})
		it('should perform full join', () => {
			const result = child.fullJoin(parent, matcher)
			expect(result.select()).toEqual(joindata.full.no_rename)
			expect(result).not.toEqual(child)
			expect(result).not.toEqual(parent)
		})
		it('should perform cross join', () => {
			const result = child.crossJoin(parent)
			expect(result.select()).toEqual(joindata.cross.no_rename)
			expect(result).not.toEqual(child)
			expect(result).not.toEqual(parent)
		})
		it('should perform semi join', () => {
			const result = child.semiJoin(parent, matcher)
			expect(result.select()).toEqual(joindata.semi.no_rename)
			expect(result).not.toEqual(child)
			expect(result).not.toEqual(parent)
		})
		it('should perform anti join', () => {
			const result = child.antiJoin(parent, matcher)
			expect(result.select()).toEqual(joindata.anti.no_rename)
			expect(result).not.toEqual(child)
			expect(result).not.toEqual(parent)
		})
		it('should perform nested join', () => {
			const result = parent.nestedJoin(child, matcher)
			expect(result.select()).toEqual(joindata.nested)
			expect(result).not.toEqual(child)
			expect(result).not.toEqual(parent)
		})
	})
})
