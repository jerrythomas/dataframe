import { describe, expect, it } from 'vitest'
import { tweenable } from '../src/tweenable'
import fixture from './fixtures/rollup'

describe('tweenable', () => {
	it('should generate timelapse groups', () => {
		const result = tweenable('date')
			.useDefaults({
				score: 0,
				pct: 0
			})
			.groupBy('group', 'team')
			.transform(fixture.nba)

		expect(result).toEqual(fixture.nba_by_date)
	})
})
