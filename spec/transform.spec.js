import { beforeAll, describe, expect, it } from 'vitest'
import { tweenable } from '../src/transform'
import { data } from './fixtures/data'
import fs from 'fs'
import yaml from 'js-yaml'

describe('Animation transform', () => {
	const input = JSON.parse(fs.readFileSync('./spec/fixtures/nba/data.json'))
	const groups = {
		team: JSON.parse(fs.readFileSync('./spec/fixtures/nba/team-score.json')),
		group: JSON.parse(fs.readFileSync('./spec/fixtures/nba/group-score.json')),
		'group-team': JSON.parse(fs.readFileSync('./spec/fixtures/nba/group-team-score.json')),
		'group-team-pct': JSON.parse(fs.readFileSync('./spec/fixtures/nba/group-team-pct.json'))
	}
	const nested = {
		'date-team-score': JSON.parse(fs.readFileSync('./spec/fixtures/nba/date-team-score.json')),
		'date-group-team-score': JSON.parse(
			fs.readFileSync('./spec/fixtures/nba/date-group-team-score.json')
		)
	}
	beforeAll(() => {})

	it('should ignore attributes not in data', () => {
		let result = tweenable().transform(input)
		expect(result).toEqual(input)
		result = tweenable().group(['name']).transform(input)
		expect(result).toEqual(input)
		result = tweenable().key('name').transform(input)
		expect(result).toEqual(input)
		result = tweenable().key('name').sort().group(['country']).transform(input)
		expect(result).toEqual(input)
	})

	it('should create flat groups', () => {
		let result = tweenable().rollup('score').group(['team']).transform(input)
		expect(result).toEqual(groups['team'])

		result = tweenable().rollup('score').group(['group']).transform(input)
		expect(result).toEqual(groups['group'])

		result = tweenable().rollup('score').group(['group', 'team']).transform(input)
		expect(result).toEqual(groups['group-team'])

		result = tweenable().rollup('pct').group(['group', 'team']).transform(input)
		expect(result).toEqual(groups['group-team-pct'])
	})

	it('should create nested arrays', () => {
		let result = tweenable().rollup('score').group(['team']).key('date').transform(input)
		expect(result).toEqual(nested['date-team-score'])

		result = tweenable().rollup('score').group(['group', 'team']).key('date').transform(input)
		expect(result).toEqual(nested['date-group-team-score'])
	})
})
