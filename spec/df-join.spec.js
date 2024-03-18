import { describe, expect, it } from 'vitest'
import { dataframe } from '../src/df'
import joindata from './fixtures/join'

describe('join', () => {
	const child = dataframe([...joindata.ships])
	const parent = dataframe([...joindata.groups])
	const matcher = (child, parent) => child.group_id === parent.id

	describe('inner', () => {
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
	})

	describe('outer', () => {
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
	})

	describe('full', () => {
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

	describe('nested', () => {
		it('should perform nested join using `nestedJoin`', () => {
			const nested = child.nestedJoin(parent, matcher)
			expect(nested.data).toEqual(joindata.nested)
			expect(child.data).toEqual(joindata.ships)
			expect(parent.data).toEqual(joindata.groups)
			expect(nested.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{ name: 'class', type: 'string' },
				{
					metadata: [
						{ name: 'id', type: 'integer' },
						{ name: 'name', type: 'string' },
						{ name: 'group_id', type: 'integer' }
					],
					name: 'children',
					type: 'array'
				}
			])
		})

		it('should join generating a nested dataframe', () => {
			const nested = child.join(parent, matcher, { type: 'nested' })
			expect(nested.data).toEqual(joindata.nested)
			expect(child.data).toEqual(joindata.ships)
			expect(parent.data).toEqual(joindata.groups)
			expect(nested.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{ name: 'class', type: 'string' },
				{
					metadata: [
						{ name: 'id', type: 'integer' },
						{ name: 'name', type: 'string' },
						{ name: 'group_id', type: 'integer' }
					],
					name: 'children',
					type: 'array'
				}
			])
		})
	})
})
