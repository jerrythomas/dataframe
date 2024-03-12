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

	if (item.parent.removedByFilter) {
		item.parent.removedByFilter = false
		item.parent.retainedByChild = true
		// Recursively update parent's parent
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
		item.removedByFilter = !filterFn(item)
	})

	arr.forEach((item) => {
		if (item.parent) {
			updateParentFlags(item)
		}
	})
}
