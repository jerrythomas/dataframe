import { defaultViewOptions } from './constants'
/**
 * Removes objects from an array where the parent attribute is not null.
 * @param {Array<Object>} arr - The array of objects.
 */
export function removeChildren(arr) {
	for (let i = arr.length - 1; i >= 0; i--) {
		if (arr[i].parent) arr.splice(i, 1)
	}
}
/**
 * Flatten nested children arrays within an array of objects.
 * @param {Array<Object>} arr - The array of objects.
 */
export function flattenNestedChildren(arr) {
	let index = 0
	while (index < arr.length) {
		if (Array.isArray(arr[index].children) && arr[index].children.length > 0) {
			const children = arr[index].children
			arr.splice(index + 1, 0, ...children)
		}
		index++
	}
}

/**
 * Recursively updates parent items' flags based on the child's flags.
 * @param {Object} item - The current object.
 */
function updateParentFlags(item) {
	if (!item.parent) return
	if (item.parent.excluded) {
		item.parent.excluded = false
		item.parent.retainedByChild = true

		updateParentFlags(item.parent)
	}
}

/**
 * Applies a hierarchical filter to an array of objects.
 * @param {Array<Object>} arr - The array of objects.
 * @param {Function} filterFn - The filter function to apply on each object.
 */
export function hierarchicalFilter(arr, filterFn) {
	arr.forEach((item) => {
		item.excluded = !filterFn(item)
	})

	arr.forEach((item) => {
		if (!item.excluded) updateParentFlags(item)
	})
}

/**
 * Derives the hierarchy from the data.
 *
 * @param {Array} data - The data to derive the hierarchy from.
 * @param {string} path - The column name to be used as hierarchical path.
 * @param {string} separator - The separator to be used in the path.
 * @returns {Array<import('./types').Hierarchy>} - The derived hierarchy.
 */
export function deriveHierarchy(data, options) {
	const { expanded, path, separator } = { ...defaultViewOptions, ...options }
	if (!path) return data.map((row) => ({ depth: 0, row }))

	const hierarchy = data.map((row) => {
		const parts = row[path].split(separator).filter((part) => part.length > 0)
		const depth = parts.length
		const value = depth > 0 ? parts[depth - 1] : ''
		return { depth, value, path: row[path], row }
	})

	hierarchy.forEach((row) => {
		row.children = hierarchy.filter(
			(child) => child.path.startsWith(row.path) && row.depth === child.depth - 1
		)

		row.isParent = row.children.length > 0
		if (row.isParent) {
			row.isExpanded = expanded
			row.isHidden = !row.parent ? false : row.parent.isHidden || !row.parent.isExpanded
		}
		row.children.forEach((child) => {
			child.parent = row
			child.isHidden = row.isHidden || !row.isExpanded
		})
	})
	return hierarchy
}

function changeVisibilityForChildren(node) {
	if (node.children) {
		node.children.forEach((child) => {
			child.isHidden = node.isHidden || !node.isExpanded
			changeVisibilityForChildren(child)
		})
	}
}
export function toggleExpansion(node) {
	if (node.isParent) {
		node.isExpanded = !node.isExpanded
		changeVisibilityForChildren(node)
	}
}
