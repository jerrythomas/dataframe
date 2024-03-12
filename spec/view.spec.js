import { describe, it, expect } from 'vitest'
import { createView } from '../src/view'
import { pick, omit } from 'ramda'

describe('View', () => {
	describe('createView', () => {
		describe('flat', () => {
			const data = [
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 20 },
				{ name: 'Charlie', age: 35 }
			]
			it('should create a view', () => {
				const view = createView(data)

				expect(view.columns).toEqual([
					{
						name: 'name',
						type: 'string',
						fields: { text: 'name' },
						formatter: expect.any(Function),
						sortable: true,
						filterable: true,
						sorted: 'none'
					},
					{
						name: 'age',
						type: 'integer',
						fields: { text: 'age' },
						formatter: expect.any(Function),
						sortable: true,
						filterable: true,
						sorted: 'none'
					}
				])
				expect(view.hierarchy).toEqual([
					{ depth: 0, row: { name: 'Alice', age: 25 } },
					{ depth: 0, row: { name: 'Bob', age: 20 } },
					{ depth: 0, row: { name: 'Charlie', age: 35 } }
				])
				expect(view.filter).toBeInstanceOf(Function)
				expect(view.clearSort).toBeInstanceOf(Function)
				expect(view.sortBy).toBeInstanceOf(Function)
				expect(view.select).toBeInstanceOf(Function)
				expect(view.toggle).toBeInstanceOf(Function)
			})

			it('should sort by a column', () => {
				const view = createView(data)
				view.sortBy('age')
				expect(view.hierarchy).toEqual([
					{ depth: 0, row: { name: 'Bob', age: 20 } },
					{ depth: 0, row: { name: 'Alice', age: 25 } },
					{ depth: 0, row: { name: 'Charlie', age: 35 } }
				])
			})

			it('should sort by a column in descending order', () => {
				const view = createView(data)
				view.sortBy('age', false)
				expect(view.hierarchy).toEqual([
					{ depth: 0, row: { name: 'Charlie', age: 35 } },
					{ depth: 0, row: { name: 'Alice', age: 25 } },
					{ depth: 0, row: { name: 'Bob', age: 20 } }
				])
			})

			it('should select a row', () => {
				const view = createView(data)
				view.select(0)
				expect(view.hierarchy[0].selected).toBe('checked')
			})
		})
		describe('hierarchy', () => {
			const data = [
				{ name: 'Smith', lineage: '/Smith', age: 90 },
				{ name: 'Bob', lineage: '/Smith/Bob', age: 20 },
				{ name: 'Alice', lineage: '/Smith/Alice', age: 55 },
				{ name: 'Lexi', lineage: '/Smith/Alice/Lexi', age: 30 },
				{ name: 'Sofia', lineage: '/Smith/Alice/Sofia', age: 25 },
				{ name: 'Snow', lineage: '/Snow', age: 80 },
				{ name: 'Charlie', lineage: '/Snow/Charlie', age: 35 },
				{ name: 'Eve', lineage: '/Snow/Eve', age: 40 }
			]

			it('should create a view', () => {
				const view = createView(data, { path: 'lineage' })

				expect(view.columns).toEqual([
					{
						name: 'lineage',
						type: 'string',
						sortable: true,
						filterable: true,
						sorted: 'none',
						path: true,
						separator: '/',
						fields: { text: 'lineage' },
						formatter: expect.any(Function)
					},
					{
						name: 'name',
						type: 'string',
						sortable: true,
						filterable: true,
						sorted: 'none',
						fields: { text: 'name' },
						formatter: expect.any(Function)
					},
					{
						name: 'age',
						type: 'integer',
						sortable: true,
						filterable: true,
						sorted: 'none',
						fields: { text: 'age' },
						formatter: expect.any(Function)
					}
				])
				let hierarchy = [
					{
						depth: 1,
						isExpanded: false,
						isParent: true,
						path: '/Smith',
						value: 'Smith',
						row: { name: 'Smith', lineage: '/Smith', age: 90 }
					},
					{
						depth: 2,
						isParent: false,
						path: '/Smith/Bob',
						value: 'Bob',
						row: { name: 'Bob', lineage: '/Smith/Bob', age: 20 }
					},
					{
						depth: 2,
						isExpanded: false,
						isParent: true,
						path: '/Smith/Alice',
						value: 'Alice',
						row: { name: 'Alice', lineage: '/Smith/Alice', age: 55 }
					},
					{
						depth: 3,
						isParent: false,
						path: '/Smith/Alice/Lexi',
						value: 'Lexi',
						row: { name: 'Lexi', lineage: '/Smith/Alice/Lexi', age: 30 }
					},
					{
						depth: 3,
						isParent: false,
						path: '/Smith/Alice/Sofia',
						value: 'Sofia',
						row: { name: 'Sofia', lineage: '/Smith/Alice/Sofia', age: 25 }
					},
					{
						depth: 1,
						isExpanded: false,
						isParent: true,
						path: '/Snow',
						value: 'Snow',
						row: { name: 'Snow', lineage: '/Snow', age: 80 }
					},
					{
						depth: 2,
						isParent: false,
						path: '/Snow/Charlie',
						value: 'Charlie',
						row: { name: 'Charlie', lineage: '/Snow/Charlie', age: 35 }
					},
					{
						depth: 2,
						isParent: false,
						path: '/Snow/Eve',
						value: 'Eve',
						row: { name: 'Eve', lineage: '/Snow/Eve', age: 40 }
					}
				]
				// console.log(view.hierarchy)
				expect(view.hierarchy.map((x) => omit(['parent', 'children'], x))).toEqual(hierarchy)
				expect(view.filter).toBeInstanceOf(Function)
				expect(view.clearSort).toBeInstanceOf(Function)
				expect(view.sortBy).toBeInstanceOf(Function)
				expect(view.select).toBeInstanceOf(Function)
				expect(view.toggle).toBeInstanceOf(Function)
			})

			it('should sort by a column', () => {
				const view = createView(data, { path: 'lineage' })
				view.sortBy('age')
				expect(view.hierarchy.map(({ row }) => row)).toEqual([
					{ name: 'Snow', lineage: '/Snow', age: 80 },
					{ name: 'Charlie', lineage: '/Snow/Charlie', age: 35 },
					{
						name: 'Eve',
						lineage: '/Snow/Eve',
						age: 40
					},
					{
						name: 'Smith',
						lineage: '/Smith',
						age: 90
					},
					{
						name: 'Bob',
						lineage: '/Smith/Bob',
						age: 20
					},
					{
						name: 'Alice',
						lineage: '/Smith/Alice',
						age: 55
					},
					{
						name: 'Sofia',
						lineage: '/Smith/Alice/Sofia',
						age: 25
					},
					{
						name: 'Lexi',
						lineage: '/Smith/Alice/Lexi',
						age: 30
					}
				])
			})

			it('should select/deselect a child row', () => {
				const view = createView(data, { path: 'lineage' })
				view.select(3)
				expect(view.hierarchy.map((x) => pick(['path', 'selected'], x))).toEqual([
					{ path: '/Smith', selected: 'indeterminate' },
					{ path: '/Smith/Bob' },
					{ path: '/Smith/Alice', selected: 'indeterminate' },
					{ path: '/Smith/Alice/Lexi', selected: 'checked' },
					{ path: '/Smith/Alice/Sofia' },
					{ path: '/Snow' },
					{ path: '/Snow/Charlie' },
					{ path: '/Snow/Eve' }
				])

				view.select(3)
				expect(view.hierarchy.map((x) => pick(['path', 'selected'], x))).toEqual([
					{ path: '/Smith', selected: 'unchecked' },
					{ path: '/Smith/Bob' },
					{ path: '/Smith/Alice', selected: 'unchecked' },
					{ path: '/Smith/Alice/Lexi', selected: 'unchecked' },
					{ path: '/Smith/Alice/Sofia' },
					{ path: '/Snow' },
					{ path: '/Snow/Charlie' },
					{ path: '/Snow/Eve' }
				])
			})

			it('should select/deselect a parent row', () => {
				const view = createView(data, { path: 'lineage' })
				view.select(0)
				expect(view.hierarchy.map((x) => pick(['path', 'selected'], x))).toEqual([
					{ path: '/Smith', selected: 'checked' },
					{ path: '/Smith/Bob', selected: 'checked' },
					{ path: '/Smith/Alice', selected: 'checked' },
					{ path: '/Smith/Alice/Lexi', selected: 'checked' },
					{ path: '/Smith/Alice/Sofia', selected: 'checked' },
					{ path: '/Snow' },
					{ path: '/Snow/Charlie' },
					{ path: '/Snow/Eve' }
				])

				view.select(0)
				expect(view.hierarchy.map((x) => pick(['path', 'selected'], x))).toEqual([
					{ path: '/Smith', selected: 'unchecked' },
					{ path: '/Smith/Bob', selected: 'unchecked' },
					{ path: '/Smith/Alice', selected: 'unchecked' },
					{ path: '/Smith/Alice/Lexi', selected: 'unchecked' },
					{ path: '/Smith/Alice/Sofia', selected: 'unchecked' },
					{ path: '/Snow' },
					{ path: '/Snow/Charlie' },
					{ path: '/Snow/Eve' }
				])
			})

			it('should collapse/expand a node', () => {
				const view = createView(data, { path: 'lineage' })
				view.toggle(0)
				expect(view.hierarchy.map((x) => pick(['path', 'isExpanded', 'isHidden'], x))).toEqual([
					{ path: '/Smith', isExpanded: true },
					{ path: '/Smith/Bob', isHidden: false },
					{ path: '/Smith/Alice', isExpanded: false, isHidden: false },
					{ path: '/Smith/Alice/Lexi' },
					{ path: '/Smith/Alice/Sofia' },
					{ path: '/Snow', isExpanded: false },
					{ path: '/Snow/Charlie' },
					{ path: '/Snow/Eve' }
				])
				view.toggle(0)
				expect(view.hierarchy.map((x) => pick(['path', 'isExpanded', 'isHidden'], x))).toEqual([
					{ path: '/Smith', isExpanded: false },
					{ path: '/Smith/Bob', isHidden: true },
					{ path: '/Smith/Alice', isExpanded: false, isHidden: true },
					{ path: '/Smith/Alice/Lexi', isHidden: true },
					{ path: '/Smith/Alice/Sofia', isHidden: true },
					{ path: '/Snow', isExpanded: false },
					{ path: '/Snow/Charlie' },
					{ path: '/Snow/Eve' }
				])
			})
		})
	})
})
