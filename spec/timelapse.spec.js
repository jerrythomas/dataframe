import { describe, expect, it } from 'vitest'
import fs from 'fs'
import { timelapse } from '../src/timelapse'

describe('Timelapse', () => {
	const input = JSON.parse(fs.readFileSync('./spec/fixtures/nba/data.json'))
	const byDate = JSON.parse(fs.readFileSync('./spec/fixtures/nba/by-date.json'))
	// const simulated = JSON.parse(fs.readFileSync('./spec/fixtures/data.json'))

	it('should generate timelapse groups', () => {
		const result = timelapse('date')
			.useDefaults({
				score: 0,
				pct: 0
			})
			.groupBy('group', 'team')
			.transform(input)

		expect(result).toEqual(byDate)
	})
})
