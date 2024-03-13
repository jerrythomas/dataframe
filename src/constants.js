import { identity } from 'ramda'

export const defaultPathOptions = {
	path: null,
	separator: '/',
	currencySuffix: '_currency'
}

export const defaultViewOptions = {
	...defaultPathOptions,
	expanded: false,
	actions: [],
	language: 'en-US',
	scanMode: 'fast'
}

export const defaultActionOrder = {
	select: 0,
	edit: 1,
	delete: 2
}

export const filterOperations = {
	'=': (value, pattern) => value === pattern,
	'<': (value, pattern) => value < pattern,
	'>': (value, pattern) => value > pattern,
	'<=': (value, pattern) => value <= pattern,
	'>=': (value, pattern) => value >= pattern,
	'~*': (value, pattern) => pattern.test(value),
	'~': (value, pattern) => pattern.test(value),
	'!=': (value, pattern) => value !== pattern,
	'!~*': (value, pattern) => !pattern.test(value),
	'!~': (value, pattern) => !pattern.test(value)
}

export const typeConverters = {
	string: (value) => String(value),
	number: (value) => Number(value),
	boolean: (value) => value === 'true' || value === true,
	date: (value) => new Date(value),
	mixed: identity
}
