import { describe, expect, it } from 'vitest'
import { dataframe } from '../src/dataframe'
import { defaultConfig } from '../src/constants'

describe('dataframe -> configurations', () => {
	const data = [{ a: 1, b: '2' }]

	it('should exclude invalid fields while configuring alignment', () => {
		const df = dataframe([])
		const updated = df.align('a', 'b')
		expect(updated.config.align_by).toEqual([])
		expect(updated).toBe(df)
	})

	it('should set the alignment configuration', () => {
		const df = dataframe(data)
		const updated = df.align('a', 'b')
		expect(updated.config.align_by).toEqual(['a', 'b'])
		expect(updated).toBe(df)
	})

	it('should set the template', () => {
		const df = dataframe(data)
		const updated = df.using({ a: 1 })
		expect(updated.config.template).toEqual({ a: 1 })
		expect(updated).toBe(df)
	})
	it('should override actual_flag', () => {
		const df = dataframe([])

		expect(df.config).toEqual(defaultConfig)
		const updated = df.override({ actual_flag: 'x' })
		expect(updated.config.actual_flag).toBe('x')
		expect(updated).toBe(df)
	})
	it('should override children field', () => {
		const df = dataframe([])
		expect(df.config).toEqual(defaultConfig)
		const updated = df.override({ children: '_x' })
		expect(updated.config.children).toBe('_x')
		expect(updated).toBe(df)
	})
	it('should override multiple configurations', () => {
		const df = dataframe([])
		expect(df.config).toEqual(defaultConfig)
		const updated = df.override({ children: '_child', actual_flag: '_actual' })
		expect(updated.config.children).toBe('_child')
		expect(updated.config.actual_flag).toBe('_actual')
		expect(updated).toBe(df)
	})
})
