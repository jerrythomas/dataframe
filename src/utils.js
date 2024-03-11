/**
 * Check if a value is a date string
 * @param {string} value
 * @returns {boolean}
 */
function isDateString(value) {
	return !isNaN(Date.parse(value))
}

/**
 * Derive the type of a value
 * @param {any} value
 * @returns {string}
 */
export function getType(value) {
	if (Array.isArray(value)) return 'array'
	if (value instanceof Date) return 'date'

	let type = typeof value
	if (type === 'number' && Number.isInteger(value)) return 'integer'
	return type === 'string' && isDateString(value) ? 'date' : type
}
