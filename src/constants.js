import { identity } from 'ramda'

export const defaultViewOptions = {
	expanded: false,
	path: null,
	separator: '/',
	actions: [],
	language: 'en-US'
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
	'!=': (value, pattern) => value !== pattern,
	'~*': (value, pattern) => pattern.test(value),
	'~': (value, pattern) => pattern.test(value),
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
