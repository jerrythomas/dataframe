import { describe, it, expect } from 'vitest'
import { removeChildren, flattenNestedChildren } from '../src/hierarchy'

describe('hierarchy', () => {
	describe('removeChildren function', () => {
		it('should remove objects with parent attribute not null', () => {
			const arr = [
				{ name: 'Object 1' },
				{ name: 'Object 2', parent: { name: 'Parent Object' } },
				{ name: 'Object 3' }
			]

			removeChildren(arr)

			expect(arr.length).toBe(2)
			expect(arr).toEqual([{ name: 'Object 1' }, { name: 'Object 3' }])
		})

		it('should not modify the array if all objects have parent attribute as null', () => {
			const arr = [
				{ name: 'Object 1', parent: null },
				{ name: 'Object 2', parent: null },
				{ name: 'Object 3', parent: null }
			]

			removeChildren(arr)

			expect(arr.length).toBe(3)
			expect(arr).toEqual([
				{ name: 'Object 1', parent: null },
				{ name: 'Object 2', parent: null },
				{ name: 'Object 3', parent: null }
			])
		})
	})

	describe('flattenNestedChildren', () => {
		it('should flatten nested children arrays', () => {
			const arr = [
				{
					name: 'Parent 1',
					children: [
						{ name: 'Child 1', children: [{ name: 'Grand Child 1' }] },
						{ name: 'Child 2' }
					]
				},
				{ name: 'Parent 2', children: [{ name: 'Child 3' }, { name: 'Child 4' }] },
				{ name: 'Parent 3', children: [{ name: 'Child 5' }, { name: 'Child 6' }] }
			]

			flattenNestedChildren(arr)

			expect(arr.length).toBe(10)
			expect(arr).toEqual([
				{
					name: 'Parent 1',
					children: [
						{ name: 'Child 1', children: [{ name: 'Grand Child 1' }] },
						{ name: 'Child 2' }
					]
				},
				{ name: 'Child 1', children: [{ name: 'Grand Child 1' }] },
				{ name: 'Grand Child 1' },
				{ name: 'Child 2' },
				{ name: 'Parent 2', children: [{ name: 'Child 3' }, { name: 'Child 4' }] },
				{ name: 'Child 3' },
				{ name: 'Child 4' },
				{ name: 'Parent 3', children: [{ name: 'Child 5' }, { name: 'Child 6' }] },
				{ name: 'Child 5' },
				{ name: 'Child 6' }
			])
		})

		it('should handle arrays with no children', () => {
			const arr = [{ name: 'Parent 1' }, { name: 'Parent 2' }, { name: 'Parent 3' }]

			flattenNestedChildren(arr)

			expect(arr.length).toBe(3)
			expect(arr).toEqual([{ name: 'Parent 1' }, { name: 'Parent 2' }, { name: 'Parent 3' }])
		})
	})
})
