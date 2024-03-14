import { pick } from 'ramda'
import { _DATA, _COLUMNS } from './symbols'

/**
 * Represents an index for a table, allowing quick lookup and retrieval based on specified columns.
 */
export class TableIndex {
	/**
	 * Constructs the TableIndex with a reference to the table and columns to index on.
	 *
	 * @param {object[]} table - The table data (array of objects) to build the index from.
	 * @param {...string} cols - The names of the columns to create an index for.
	 */
	constructor(table, ...cols) {
		this[_COLUMNS] = cols
		this.reindex(table)
	}

	/**
	 * Gets the list of columns that this index is built upon.
	 *
	 * @returns {string[]} An array of column names that form the index.
	 */
	get columns() {
		return this[_COLUMNS]
	}

	/**
	 * Rebuilds the index based on the current table data and index columns.
	 *
	 * @param {object[]} table - The table data (array of objects) to build the index from.
	 */
	reindex(table) {
		this[_DATA] = table.data.map((d, index) => ({
			...pick(this.columns, d),
			index
		}))
	}
}
