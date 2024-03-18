import { identity } from 'ramda'
import { getDeepScanSample } from './infer'
import { getType } from './utils'

/**
 * Combines two arrays of metadata into a single array.
 *
 * @param {import('./types).Metadata} first  - The first array of metadata.
 * @param {import('./types).Metadata} second - The second array of metadata.
 *
 * @returns {import('./types').Metadata} The combined array of metadata.
 */
export function combineMetadata(first, second, overwrite = false) {
	const metadata = [...first]
	second.map(({ name, type }) => {
		const existing = metadata.find((x) => x.name === name)
		if (existing) {
			if (overwrite) {
				existing.type = type
			} else if (existing.type !== type) {
				throw 'Metadata conflict: ' + name + ' has conflicting types'
			}
		} else {
			metadata.push({ name, type })
		}
	})
	return metadata
}

/**
 * Derives the column metadata from the provided data and options.
 *
 * @param {Array} data                       - The data to derive the column metadata from.
 * @param {Object} [options]                 - Optional parameters to control the metadata derivation.
 * @param {Array} [options.metadata]         - The metadata to use instead of deriving it from the data.
 * @param {boolean} [options.deepScan=false] - Determines if the metadata derivation should perform a deep scan of the data.
 *
 * @returns {import('./types').Metadata} The derived column metadata.
 */
export function deriveColumnMetadata(data, options = {}) {
	const { metadata, deepScan = false } = options
	if (Array.isArray(metadata) && metadata.length > 0) return metadata
	if (data.length === 0) return []
	const sample = deepScan ? getDeepScanSample(data) : data[0]
	return Object.entries(sample).map(([name, value]) => ({ name, type: getType(value) }))
}

/**
 * Derive column index from metadata.
 * @param {Array} metadata - The metadata array.
 * @returns {Object} - The column index object.
 */
export function deriveColumnIndex(metadata) {
	return metadata.reduce((acc, col, index) => {
		acc[col.name] = index
		return acc
	}, {})
}

/**
 * Generates a renamer function which adds a prefix or suffix to a string.
 *
 * @param {OptionsToRenameKeys} options - Options to rename keys
 * @returns {Function} - A function that takes a string and adds a prefix or suffix.
 */
export function getAttributeRenamer(options) {
	const { prefix, suffix, separator = '_' } = options
	let rename = identity
	if (prefix) {
		rename = (x) => [prefix, x].join(separator)
	} else if (suffix) {
		rename = (x) => [x, suffix].join(separator)
	}
	return rename
}

export function getRenamerUsingLookup(lookup) {
	return (row) =>
		Object.entries(row).reduce((acc, [key, value]) => ({ ...acc, [lookup[key]]: value }), {})
}
/**
 * Returns a function that renames all the keys of an object using a renamer function
 *
 * @param {Function} keyNamer - A function that takes a key and returns a new key.
 * @returns {Function}               - A function that takes an object and returns a new object with renamed properties.
 */
export function getDataRenamer(keyNamer, keys) {
	if (keyNamer === identity) return identity
	const lookup = keys.reduce((acc, key) => ({ ...acc, [key]: keyNamer(key) }), {})
	return getRenamerUsingLookup(lookup)
}
