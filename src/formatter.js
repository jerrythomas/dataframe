import { identity } from 'ramda'

/**
 * Creates a formatter function that formats a value according to the specified type and optional locale settings.
 * Supported types include 'default' (no formatting), 'integer', 'number', 'date', 'time', and 'currency'.
 *
 * The function is curried, which means it can be partially applied with some arguments and reused
 * to format different values with the same settings.
 *
 * @param {string} type               - The type of the formatter to use (e.g., 'integer', 'number', 'date', 'time', 'currency').
 * @param {string} [language='en-US'] - Optional IETF language tag used for locale-specific formatting.
 * @param {number} [decimalPlaces=2]  - Optional number of decimal places to show with number and currency formatting.
 * @returns {*}                       - A format function that takes a value and returns a formatted string.
 */
export function createFormatter(type, language = 'en-US', decimalPlaces = 2) {
	const formatWithLocaleOptions = (options, val) => val.toLocaleString(language, options)
	const formatCurrency = (val, currency = 'USD') =>
		val.toLocaleString(language, {
			style: 'currency',
			currency,
			minimumFractionDigits: decimalPlaces,
			maximumFractionDigits: decimalPlaces
		})

	const formatters = {
		currency: formatCurrency,
		integer: (val) => formatWithLocaleOptions({ maximumFractionDigits: 0 }, val),
		number: (val) =>
			formatWithLocaleOptions(
				{
					minimumFractionDigits: decimalPlaces,
					maximumFractionDigits: decimalPlaces
				},
				val
			),
		date: (val) => val.toLocaleDateString(language),
		time: (val) => val.toLocaleTimeString(language),
		object: (val) => JSON.stringify(val),
		array: (val) => JSON.stringify(val),
		ellipsis: () => '...'
	}
	return type in formatters ? formatters[type] : identity
}
