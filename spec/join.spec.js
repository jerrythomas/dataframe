import { describe, expect, it } from 'vitest'
import { dataframe } from '../src/dataframe'
import joindata from './fixtures/join'

describe('join', () => {
	const child = dataframe([...joindata.ships])
	const parent = dataframe([...joindata.groups])
	const matcher = (child, parent) => child.group_id === parent.id

	describe('inner', () => {
		it('should perform inner join', () => {
			let result = child.join(parent, matcher)
			expect(result.data).toEqual(joindata.inner.no_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{ name: 'name', type: 'string' },
				{ name: 'group_id', type: 'integer' },
				{ name: 'class', type: 'string' }
			])

			result = child.join(parent, matcher, { type: 'inner' })
			expect(result.data).toEqual(joindata.inner.no_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)

			result = child.innerJoin(parent, matcher)
			expect(result.data).toEqual(joindata.inner.no_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
		})

		it('should perform inner join renaming second', () => {
			const result = child.join(parent, matcher, { right: { prefix: 'group' } })
			expect(result.data).toEqual(joindata.inner.with_y_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)

			expect(result.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{ name: 'name', type: 'string' },
				{ name: 'group_id', type: 'integer' },
				{ name: 'group_class', type: 'string' }
			])
		})

		it('should perform inner join renaming first', () => {
			const result = child.join(parent, matcher, { left: { prefix: 'x' } })
			expect(result.data).toEqual(joindata.inner.with_x_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)

			expect(result.metadata).toEqual([
				{ name: 'x_id', type: 'integer' },
				{ name: 'x_name', type: 'string' },
				{ name: 'x_group_id', type: 'integer' },
				{ name: 'id', type: 'integer' },
				{ name: 'class', type: 'string' }
			])
		})

		it('should perform inner join renaming both', () => {
			const result = child.join(parent, matcher, { left: { prefix: 'x' }, right: { prefix: 'y' } })
			expect(result.data).toEqual(joindata.inner.both_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'x_id', type: 'integer' },
				{ name: 'x_name', type: 'string' },
				{ name: 'x_group_id', type: 'integer' },
				{ name: 'y_id', type: 'integer' },
				{ name: 'y_class', type: 'string' }
			])
		})
	})

	describe('left', () => {
		it('should perform left join', () => {
			let result = child.join(parent, matcher, { type: 'left' })
			expect(result.data).toEqual(joindata.left.no_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{ name: 'name', type: 'string' },
				{ name: 'group_id', type: 'integer' },
				{ name: 'class', type: 'string' }
			])

			result = child.leftJoin(parent, matcher)
			expect(result.data).toEqual(joindata.left.no_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
		})

		it('should perform left join renaming second', () => {
			const result = child.join(parent, matcher, { type: 'left', right: { prefix: 'y' } })
			expect(result.data).toEqual(joindata.left.y_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{ name: 'name', type: 'string' },
				{ name: 'group_id', type: 'integer' },
				{ name: 'y_id', type: 'integer' },
				{ name: 'y_class', type: 'string' }
			])
		})

		it('should perform left join renaming first', () => {
			const result = child.join(parent, matcher, { type: 'left', left: { prefix: 'x' } })
			expect(result.data).toEqual(joindata.left.x_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'x_id', type: 'integer' },
				{ name: 'x_name', type: 'string' },
				{ name: 'x_group_id', type: 'integer' },
				{ name: 'id', type: 'integer' },
				{ name: 'class', type: 'string' }
			])
		})

		it('should perform left join renaming both', () => {
			const result = child.join(parent, matcher, {
				type: 'left',
				left: { prefix: 'x' },
				right: { prefix: 'y' }
			})
			expect(result.data).toEqual(joindata.left.both_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'x_id', type: 'integer' },
				{ name: 'x_name', type: 'string' },
				{ name: 'x_group_id', type: 'integer' },
				{ name: 'y_id', type: 'integer' },
				{ name: 'y_class', type: 'string' }
			])
		})
	})

	describe('right', () => {
		it('should perform right join', () => {
			let result = child.join(parent, matcher, { type: 'right' })
			expect(result.data).toEqual(joindata.right.no_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{ name: 'name', type: 'string' },
				{ name: 'group_id', type: 'integer' },
				{ name: 'class', type: 'string' }
			])

			result = child.rightJoin(parent, matcher)
			expect(result.data).toEqual(joindata.right.no_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
		})

		it('should perform right join renaming second', () => {
			const result = child.join(parent, matcher, { type: 'right', right: { prefix: 'y' } })
			expect(result.data).toEqual(joindata.right.y_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{ name: 'name', type: 'string' },
				{ name: 'group_id', type: 'integer' },
				{ name: 'y_id', type: 'integer' },
				{ name: 'y_class', type: 'string' }
			])
		})

		it('should perform right join renaming first', () => {
			const result = child.join(parent, matcher, { type: 'right', left: { prefix: 'x' } })
			expect(result.data).toEqual(joindata.right.x_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'x_id', type: 'integer' },
				{ name: 'x_name', type: 'string' },
				{ name: 'x_group_id', type: 'integer' },
				{ name: 'id', type: 'integer' },
				{ name: 'class', type: 'string' }
			])
		})

		it('should perform right join renaming both', () => {
			const result = child.join(parent, matcher, {
				type: 'right',
				left: { prefix: 'x' },
				right: { prefix: 'y' }
			})
			expect(result.data).toEqual(joindata.right.both_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
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
			let result = child.join(parent, matcher, { type: 'full' })
			expect(result.data).toEqual(joindata.full.no_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{ name: 'name', type: 'string' },
				{ name: 'group_id', type: 'integer' },
				{ name: 'class', type: 'string' }
			])

			result = child.fullJoin(parent, matcher)
			expect(result.data).toEqual(joindata.full.no_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
		})
		it('should perform full join renaming right', () => {
			const result = child.join(parent, matcher, { type: 'full', right: { prefix: 'y' } })
			expect(result.data).toEqual(joindata.full.y_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'id', type: 'integer' },
				{ name: 'name', type: 'string' },
				{ name: 'group_id', type: 'integer' },
				{ name: 'y_id', type: 'integer' },
				{ name: 'y_class', type: 'string' }
			])
		})
		it('should perform full join renaming left', () => {
			const result = child.join(parent, matcher, { type: 'full', left: { prefix: 'x' } })
			expect(result.data).toEqual(joindata.full.x_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
				{ name: 'x_id', type: 'integer' },
				{ name: 'x_name', type: 'string' },
				{ name: 'x_group_id', type: 'integer' },
				{ name: 'id', type: 'integer' },
				{ name: 'class', type: 'string' }
			])
		})

		it('should perform full join renaming both', () => {
			const result = child.join(parent, matcher, {
				type: 'full',
				left: { prefix: 'x' },
				right: { prefix: 'y' }
			})
			expect(result.data).toEqual(joindata.full.both_rename)
			expect(parent.data).toEqual(joindata.groups)
			expect(child.data).toEqual(joindata.ships)
			expect(result.metadata).toEqual([
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
			const result = child.nestedJoin(parent, matcher)
			expect(result.data).toEqual(joindata.nested)
			expect(child.data).toEqual(joindata.ships)
			expect(parent.data).toEqual(joindata.groups)
			expect(result.metadata).toEqual([
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
			const result = child.join(parent, matcher, { type: 'nested' })
			expect(result.data).toEqual(joindata.nested)
			expect(child.data).toEqual(joindata.ships)
			expect(parent.data).toEqual(joindata.groups)
			expect(result.metadata).toEqual([
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
