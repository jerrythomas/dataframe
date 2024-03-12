import { describe, it, expect } from 'vitest'
import { removeChildren, flattenNestedChildren, hierarchicalFilter } from '../src/hierarchy'
import { pick } from 'ramda'

describe('hierarchy', () => {
	describe('removeChildren', () => {
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

	describe('hierarchicalFilter', () => {
		let nestedArray

		beforeEach(() => {
			nestedArray = [
				{ name: 'Parent 1' },
				{ name: 'Child 1' },
				{ name: 'Child 2' },
				{ name: 'Grand Child 2.1' },
				{ name: 'Parent 2' },
				{ name: 'Child 3' },
				{ name: 'Child 4' }
			]
			nestedArray[1].parent = nestedArray[0]
			nestedArray[2].parent = nestedArray[0]
			nestedArray[3].parent = nestedArray[2]
			nestedArray[5].parent = nestedArray[4]
			nestedArray[6].parent = nestedArray[4]
		})

		it('should update parent flags correctly', () => {
			const filterFn = (item) => item.name === 'Child 3'

			hierarchicalFilter(nestedArray, filterFn)

			expect(
				nestedArray.map((item) => pick(['name', 'excluded', 'retainedByChild'], item))
			).toEqual([
				{ name: 'Parent 1', excluded: true },
				{ name: 'Child 1', excluded: true },
				{ name: 'Child 2', excluded: true },
				{ name: 'Grand Child 2.1', excluded: true },
				{ name: 'Parent 2', excluded: false, retainedByChild: true },
				{ name: 'Child 3', excluded: false },
				{ name: 'Child 4', excluded: true }
			])
		})

		it('should update parent flags correctly', () => {
			const filterFn = (item) => item.name === 'Grand Child 2.1'

			hierarchicalFilter(nestedArray, filterFn)

			expect(
				nestedArray.map((item) => pick(['name', 'excluded', 'retainedByChild'], item))
			).toEqual([
				{ name: 'Parent 1', excluded: false, retainedByChild: true },
				{ name: 'Child 1', excluded: true },
				{ name: 'Child 2', excluded: false, retainedByChild: true },
				{ name: 'Grand Child 2.1', excluded: false },
				{ name: 'Parent 2', excluded: true },
				{ name: 'Child 3', excluded: true },
				{ name: 'Child 4', excluded: true }
			])
		})

		it('should handle arrays with no parent', () => {
			const arr = [
				{ name: 'Object 1', parent: null },
				{ name: 'Object 2', parent: null },
				{ name: 'Object 3', parent: null }
			]

			// Mock filter function
			const filterFn = (item) => item.name !== 'Object 1'

			hierarchicalFilter(arr, filterFn)

			expect(arr[0].excluded).toBe(true)
			expect(arr[1].excluded).toBe(false)
			expect(arr[2].excluded).toBe(false)

			expect(arr[0].retainedByChild).toBeUndefined()
			expect(arr[1].retainedByChild).toBeUndefined()
			expect(arr[2].retainedByChild).toBeUndefined()
		})
	})
})
