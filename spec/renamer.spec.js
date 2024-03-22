import { describe, expect, it } from 'vitest'
import { renamer } from '../src/renamer'

describe('renamer', () => {
	it('should return an object with methods', () => {
		const r = renamer()
		expect(r).toEqual({
			get: expect.any(Function),
			setPrefix: expect.any(Function),
			setSuffix: expect.any(Function),
			setKeys: expect.any(Function),
			setSeparator: expect.any(Function)
		})
	})

	describe('rename', () => {
		it('should not rename', () => {
			const r = renamer().get()
			expect(r.rename('a')).toBe('a')
			expect(r.rename('b')).toBe('b')
		})
		it('should rename using prefix', () => {
			let r = renamer({ prefix: 'a' }).get()
			expect(r.rename('b')).toBe('a_b')
			expect(r.rename('c')).toBe('a_c')

			r = renamer().setPrefix('a').get()
			expect(r.rename('b')).toBe('a_b')
			expect(r.rename('c')).toBe('a_c')
		})
		it('should rename using prefix and separator', () => {
			let r = renamer({ prefix: 'a', separator: '-' }).get()
			expect(r.rename('b')).toBe('a-b')
			expect(r.rename('c')).toBe('a-c')

			r = renamer().setPrefix('a').setSeparator('-').get()
			expect(r.rename('b')).toBe('a-b')
			expect(r.rename('c')).toBe('a-c')
		})
		it('should rename using suffix', () => {
			let r = renamer({ suffix: 'a' }).get()
			expect(r.rename('b')).toBe('b_a')
			expect(r.rename('c')).toBe('c_a')

			r = renamer().setSuffix('a').get()
			expect(r.rename('b')).toBe('b_a')
			expect(r.rename('c')).toBe('c_a')
		})
		it('should rename using suffix and separator', () => {
			let r = renamer({ suffix: 'a', separator: '-' }).get()
			expect(r.rename('b')).toBe('b-a')
			expect(r.rename('c')).toBe('c-a')

			r = renamer().setSuffix('a').setSeparator('-').get()
			expect(r.rename('b')).toBe('b-a')
			expect(r.rename('c')).toBe('c-a')
		})
	})

	describe('forObject', () => {
		it('should not rename keys', () => {
			const obj = { a: 1, b: 2 }
			const r = renamer().get()
			expect(r.renameObject(obj)).toEqual({ a: 1, b: 2 })
		})
		it('should rename keys using prefix', () => {
			const obj = { b: 1, c: 2 }
			let r = renamer({ prefix: 'a' }).get()
			expect(r.renameObject(obj)).toEqual({ a_b: 1, a_c: 2 })
			r = renamer().setPrefix('a').get()
			expect(r.renameObject(obj)).toEqual({ a_b: 1, a_c: 2 })
		})
		it('should rename keys using prefix and separator', () => {
			const obj = { b: 1, c: 2 }
			let r = renamer({ prefix: 'a', separator: '-' }).get()
			expect(r.renameObject(obj)).toEqual({ 'a-b': 1, 'a-c': 2 })
			r = renamer().setPrefix('a').setSeparator('-').get()
			expect(r.renameObject(obj)).toEqual({ 'a-b': 1, 'a-c': 2 })
		})
		it('should rename keys using suffix', () => {
			const obj = { b: 1, c: 2 }
			let r = renamer({ suffix: 'a' }).get()
			expect(r.renameObject(obj)).toEqual({ b_a: 1, c_a: 2 })
			r = renamer().setSuffix('a').get()
			expect(r.renameObject(obj)).toEqual({ b_a: 1, c_a: 2 })
		})
		it('should rename keys using suffix and separator', () => {
			const obj = { b: 1, c: 2 }
			let r = renamer({ suffix: 'a', separator: '-' }).get()
			expect(r.renameObject(obj)).toEqual({ 'b-a': 1, 'c-a': 2 })
			r = renamer().setSuffix('a').setSeparator('-').get()
			expect(r.renameObject(obj)).toEqual({ 'b-a': 1, 'c-a': 2 })
		})
	})

	describe('forObjectsWithKeys', () => {
		const keys = ['a', 'b', 'c']

		it('should not rename keys', () => {
			const obj = { a: 1, b: 2 }
			let r = renamer({ keys }).get()
			expect(r.renameObject(obj)).toEqual({ a: 1, b: 2 })
			r = renamer().setKeys(keys).get()
			expect(r.renameObject(obj)).toEqual({ a: 1, b: 2 })
		})
		it('should rename keys using prefix', () => {
			const obj = { b: 1, c: 2 }
			let r = renamer({ prefix: 'a', keys }).get()
			expect(r.renameObject(obj)).toEqual({ a_b: 1, a_c: 2 })
			r = renamer().setPrefix('a').setKeys(keys).get()
			expect(r.renameObject(obj)).toEqual({ a_b: 1, a_c: 2 })
		})
		it('should rename keys using prefix and separator', () => {
			const obj = { b: 1, c: 2 }
			let r = renamer({ prefix: 'a', separator: '-', keys }).get()
			expect(r.renameObject(obj)).toEqual({ 'a-b': 1, 'a-c': 2 })
			r = renamer().setPrefix('a').setSeparator('-').setKeys(keys).get()
			expect(r.renameObject(obj)).toEqual({ 'a-b': 1, 'a-c': 2 })
		})
		it('should rename keys using suffix', () => {
			const obj = { b: 1, c: 2 }
			let r = renamer({ suffix: 'a', keys }).get()
			expect(r.renameObject(obj)).toEqual({ b_a: 1, c_a: 2 })
			r = renamer().setSuffix('a').setKeys(keys).get()
			expect(r.renameObject(obj)).toEqual({ b_a: 1, c_a: 2 })
		})
		it('should rename keys using suffix and separator', () => {
			const obj = { b: 1, c: 2 }
			let r = renamer({ suffix: 'a', separator: '-', keys }).get()
			expect(r.renameObject(obj)).toEqual({ 'b-a': 1, 'c-a': 2 })
			r = renamer().setSuffix('a').setSeparator('-').setKeys(keys).get()
		})
	})
})
