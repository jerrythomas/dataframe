import { describe, expect, it } from 'vitest'
import { getAttributeRenamer, deriveColumnMetadata } from '../src/df-metadata'

describe('df-metadata', () => {
	describe('getAttributeRenamer', () => {
		it('should generate a prefix based renamer', () => {
			const renamer = getAttributeRenamer({ prefix: 'prefix' })
			expect(renamer('name')).toBe('prefix_name')
		})
		it('should generate a suffix based renamer', () => {
			const renamer = getAttributeRenamer({ suffix: 'suffix' })
			expect(renamer('name')).toBe('name_suffix')
		})
		it('should support a custom separator', () => {
			const renamer = getAttributeRenamer({ prefix: 'prefix', separator: '-' })
			expect(renamer('name')).toBe('prefix-name')
		})
		it('should return a default renamer', () => {
			const renamer = getAttributeRenamer({})
			expect(renamer('name')).toBe('name')
		})
	})

	describe('deriveColumnMetadata', () => {
		it('should identify metadata for sparse values', () => {
			const data = [{ a: 1 }, { b: 2 }]
			const metadata = deriveColumnMetadata(data, { deepScan: true })
			expect(metadata).toEqual([
				{ name: 'a', type: 'integer' },
				{ name: 'b', type: 'integer' }
			])
		})
	})
})
