import { describe, expect, it } from 'vitest'
import { tweenable } from '../src/transform'
import fixture from './fixtures/nba'

describe('Animation transform', () => {
	it('should ignore attributes not in data', () => {
		let result = tweenable().transform(fixture.nba)
		expect(result).toEqual(fixture.nba)
		result = tweenable().group(['name']).transform(fixture.nba)
		expect(result).toEqual(fixture.nba)
		result = tweenable().key('name').transform(fixture.nba)
		expect(result).toEqual(fixture.nba)
		result = tweenable().key('name').sort().group(['country']).transform(fixture.nba)
		expect(result).toEqual(fixture.nba)
	})

	it('should create flat groups', () => {
		let result = tweenable().rollup('score').group(['team']).transform(fixture.nba)
		expect(result).toEqual(fixture.team_score)

		result = tweenable().rollup('score').group(['group']).transform(fixture.nba)
		expect(result).toEqual(fixture.group_score)

		result = tweenable().rollup('score').group(['group', 'team']).transform(fixture.nba)
		expect(result).toEqual(fixture.group_team_score)

		result = tweenable().rollup('pct').group(['group', 'team']).transform(fixture.nba)
		expect(result).toEqual(fixture.group_team_pct)
	})

	it('should create nested arrays', () => {
		let result = tweenable().rollup('score').group(['team']).key('date').transform(fixture.nba)
		expect(result).toEqual(fixture.date_team_score)

		result = tweenable().rollup('score').group(['group', 'team']).key('date').transform(fixture.nba)
		expect(result).toEqual(fixture.date_group_team_score)
	})
})
