import { describe, expect, it } from 'vitest'
// import fs from 'fs'
import { timelapse } from '../src/timelapse'
import fixture from './fixtures/rollup'

describe('Timelapse', () => {
	it('should generate timelapse groups', () => {
		const result = timelapse('date')
			.useDefaults({
				score: 0,
				pct: 0
			})
			.groupBy('group', 'team')
			.transform(fixture.nba)

		expect(result).toEqual(fixture.nba_by_date)
	})
})
