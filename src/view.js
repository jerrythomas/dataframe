import { deriveMetadata, deriveHierarchy, deriveSortableColumns } from './infer'
import { defaultViewOptions } from './constants'
import { flattenNestedChildren, removeChildren } from './hierarchy'
export function createView(data, options) {
	const { path, separator } = { ...defaultViewOptions, ...options }
	let sortGroup = []

	const metadata = deriveMetadata(data, options)
	let hierarchy = deriveHierarchy(data, options)

	const sortBy = (name, ascending = true) => {
		sortGroup = [...sortGroup, [name, ascending]]
		groupSort(hierarchy, sortGroup)
		// console.log(hierarchy)
	}

	return {
		columns: metadata,
		hierarchy,
		filter: () => {},
		clearSort: () => (sortGroup = path ? [path] : []),
		sortBy,
		select: (index) => toggleSelection(hierarchy, index),
		toggle: (index) => toggleExpansion(hierarchy, index)
	}
}

export function groupSort(hierarchy, sortGroup) {
	let group = deriveSortableColumns(...sortGroup).map(({ column, sorter }) => ({
		column,
		sorter: (a, b) => sorter(a.row[column], b.row[column])
	}))

	removeChildren(hierarchy)
	sortNested(hierarchy, group)
	flattenNestedChildren(hierarchy)
}

function sortNested(elements, group) {
	elements
		.sort((a, b) => {
			for (const item of group) {
				const result = item.sorter(a, b)
				if (result !== 0) return result
			}
			return 0
		})
		.map((x) => {
			if (Array.isArray(x.children) && x.children.length > 0) {
				sortNested(x.children, group)
			}
		})
}

export function toggleSelection(hierarchy, index) {
	hierarchy[index].selected = hierarchy[index].selected === 'checked' ? 'unchecked' : 'checked'

	updateParents(hierarchy, index)
	updateChildren(hierarchy, index)
}

/**
 * Updates the selection state for all children of a node in the hierarchy.
 *
 * @param {Array<import('./types').Hierarchy>} hierarchy - The hierarchy to update.
 * @param {number} index - The index of the node to update.
 */
function updateChildren(hierarchy, index) {
	if (!hierarchy[index].children) return

	hierarchy[index].children.forEach((child) => {
		child.selected = hierarchy[index].selected
	})
}

/**
 * Determines the selected state of a group of children in the hierarchy.
 * If all children are checked, returns 'checked'.
 * If all children are unchecked, returns 'unchecked'.
 * Otherwise, returns 'indeterminate'.
 *
 * @param {Array<Object>} children - The array of child objects with a 'selected' property.
 * @returns {string} The determined selected state: 'checked', 'unchecked', or 'indeterminate'.
 */
function determineSelectedState(children) {
	const allChecked = children.every((child) => child.selected === 'checked')
	const allUnchecked = !allChecked && children.every((child) => child.selected === 'unchecked')

	return allChecked ? 'checked' : allUnchecked ? 'unchecked' : 'indeterminate'
}

/**
 * Updates the selection state of parent nodes in the hierarchy based on their children's states.
 * It traverses up from the provided `index` position in the hierarchy array, ensuring each
 * parent's selected state reflects whether all, none, or some of its children are selected.
 *
 * @param {Array<Object>} hierarchy - The hierarchy structure containing nodes with
 *                                    'parent' and 'children' references.
 * @param {number} index - The index of the node in the hierarchy array from where
 *                         to start updating parent nodes.
 */
function updateParents(hierarchy, index) {
	let parent = hierarchy[index].parent

	while (parent) {
		parent.selected = determineSelectedState(parent.children)
		parent = parent.parent
	}
}

function toggleExpansion(hierarchy, index) {
	if (hierarchy[index].isParent) {
		hierarchy[index].isExpanded = !hierarchy[index].isExpanded
		hierarchy[index].children.forEach((child) => {
			child.isHidden = !hierarchy[index].isExpanded
		})
	}
}
