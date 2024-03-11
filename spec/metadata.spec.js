import { describe, it, expect } from 'vitest'
import { deriveColumnProperties } from '../src/metadata'

describe('metadata', () => {
	describe('deriveColumnProperties', () => {
		it('should derive column properties', () => {
			const sample = {
				name: 'John',
				age: 25,
				amount: 1000,
				amount_currency: 'USD'
			}

			const columns = deriveColumnProperties(sample)
			expect(columns).toEqual([
				{ name: 'name', type: 'string', fields: { text: 'name' } },
				{ name: 'age', type: 'integer', fields: { text: 'age' } },
				{
					name: 'amount',
					type: 'currency',
					fields: { text: 'amount', currency: 'amount_currency' },
					digits: 2
				}
			])
		})

		it('should derive column properties with custom path', () => {
			const sample = {
				name: 'John',
				lineage: 'Adam/Smith'
			}

			const columns = deriveColumnProperties(sample, { path: 'lineage' })
			expect(columns).toEqual([
				{
					name: 'lineage',
					type: 'string',
					path: true,
					separator: '/',
					fields: { text: 'lineage' }
				},
				{ name: 'name', type: 'string', fields: { text: 'name' } }
			])
		})

		it('should derive column properties with custom path and separator', () => {
			const sample = {
				name: 'John',
				lineage: 'Adam-Smith'
			}

			const columns = deriveColumnProperties(sample, { path: 'lineage', separator: '-' })
			expect(columns).toEqual([
				{
					name: 'lineage',
					type: 'string',
					path: true,
					separator: '-',
					fields: { text: 'lineage' }
				},
				{ name: 'name', type: 'string', fields: { text: 'name' } }
			])
		})

		it('should include unmatched columns with currency suffix', () => {
			const sample = {
				amount: 1000,
				amt_currency: 'USD'
			}
			const columns = deriveColumnProperties(sample)
			expect(columns).toEqual([
				{
					name: 'amount',
					type: 'integer',
					fields: { text: 'amount' }
				},
				{
					name: 'amt_currency',
					type: 'string',
					fields: { text: 'amt_currency' }
				}
			])
		})

		it('should work with custom currency suffix', () => {
			const sample = {
				amount: 1000,
				amount_curr: 'USD'
			}
			const columns = deriveColumnProperties(sample, { currencySuffix: '_curr' })
			expect(columns).toEqual([
				{
					name: 'amount',
					type: 'currency',
					fields: { text: 'amount', currency: 'amount_curr' },
					digits: 2
				}
			])
		})
	})
})
