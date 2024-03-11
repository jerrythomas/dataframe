import { deriveMetadata, deriveHierarchy, deriveSortableColumns } from './infer'

export function createView(data, columns, options) {
	const { path, separator = '/', actions = [] } = options ?? {}
	let sortGroup = path ? [path] : []

	const metadata = deriveMetadata(data, options)
	const hierarchy = deriveHierarchy(data, options)

	const sortBy = (name, ascending = true) => {
		sortGroup = [...sortGroup, [name, ascending]]
		groupSort(hierarchy, sortGroup)
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
	const group = deriveSortableColumns(...sortGroup)

	hierarchy.sort((a, b) => {
		for (const item of group) {
			const result = item.sorter(a.row[item.column], b.row[item.column])
			if (result !== 0) return result
		}
		return 0
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

function updateParents(hierarchy, index) {
	let parent = hierarchy[index].parent

	while (parent) {
		const allChildrenSelected = parent.children.every((child) => child.selected === 'checked')
		const allChildrenDeselected = parent.children.every((child) => child.selected === 'unchecked')
		parent.selected = allChildrenSelected
			? 'checked'
			: allChildrenDeselected
				? 'unchecked'
				: 'indeterminate'
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
