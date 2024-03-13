import { identity } from 'ramda'

/**
 * Creates a formatter function that formats a value according to the specified type and optional locale settings.
 * Supported types include 'default' (no formatting), 'integer', 'number', 'date', 'time',, 'object', 'array', 'currency' & 'ellipsis''
 *
 * @param {string} type               - The type of the formatter to use (e.g., 'integer', 'number', 'date', 'time', 'currency').
 * @param {string} [language='en-US'] - Optional IETF language tag used for locale-specific formatting.
 * @param {number} [decimalPlaces=2]  - Optional number of decimal places to show with number and currency formatting.
 * @returns {*}                       - A format function that takes a value and returns a formatted string.
 */
export function createFormatter(type, language = 'en-US', decimalPlaces = 2) {
	switch (type) {
		case 'currency':
			return getCurrencyFormatter(language, decimalPlaces)
		case 'integer':
			return (val) => val.toLocaleString(language, { maximumFractionDigits: 0 })
		case 'number':
			return (val) =>
				val.toLocaleString(language, {
					minimumFractionDigits: decimalPlaces,
					maximumFractionDigits: decimalPlaces
				})
		case 'date':
			return (val) => val.toLocaleDateString(language)
		case 'time':
			return (val) => val.toLocaleTimeString(language)
		case 'object':
			return (val) => JSON.stringify(val)
		case 'array':
			return (val) => JSON.stringify(val)
		case 'ellipsis':
			return () => '...'
		default:
			return identity
	}
}

/**
 * Returns a currency formatter function that formats a value as a currency string.
 * @param {string} language       - The IETF language tag used for locale-specific formatting.
 * @param {number} decimalPlaces  - The number of decimal places to show with currency formatting.
 * @returns {function}            - A currency formatter function that takes a value and returns a formatted string.
 */
function getCurrencyFormatter(language, decimalPlaces) {
	const formatter = (val, currency = 'USD') =>
		val.toLocaleString(language, {
			style: 'currency',
			currency,
			minimumFractionDigits: decimalPlaces,
			maximumFractionDigits: decimalPlaces
		})
	return formatter
}
