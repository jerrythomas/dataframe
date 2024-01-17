import { beforeAll, describe, expect, it } from 'vitest'
import { dataframe } from '../src/dataframe'
// import {
// 	inferDataTypes,
// 	getGeneratorForMissingRows
// } from '../src/lib/timelapse'
import { timelapse } from '../src/timelapse'
// import { getSubscribedData } from './helpers'

describe('Timelapse', () => {
	beforeAll((suite) => {
		suite.input = []
		suite.byDate = []
		suite.simulated = []
		// suite.input = JSON.parse(fs.readFileSync('./spec/fixtures/table.json'))
		// suite.byDate = JSON.parse(fs.readFileSync('./spec/fixtures/by-date.json'))
		// suite.simulated = JSON.parse(fs.readFileSync('./spec/fixtures/data.json'))
	})

	it('should generate timelapse groups', (context) => {
		console.log(context.meta.suite.input)
		// const result = timelapse('date')
		// 	.useDefaults({
		// 		score: 0,
		// 		pct: 0
		// 	})
		// 	.groupBy('group', 'team')
		// 	.transform(context.meta.suite.input)
		// expect(result).toEqual(context.meta.suite.byDate)
	})
})
