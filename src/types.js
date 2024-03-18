/**
 * Options for the sort order of the column.
 *
 * @typedef {'ascending'|'descending'|'none'} SortOptions
 */

/**
 * @typedef {checked|unchecked|indeterminate} SelectionState
 */

/**
 * @typedef {string|[string,boolean]|ColumnSorter} SortableColumn
 */
/**
 * @typedef {Object} ColumnSorter
 * @property {string}   - name
 * @property {function} - sorter
 */

/**
 * @typedef {Object} ColumnAggregator
 * @property {string}   - name
 * @property {function} - aggregator
 * @property {string}   - suffix
 */

/**
 * Options for joining two data sets
 *
 * @typedef OptionsToRenameKeys
 * @property {string} [prefix]         - Prefix to be added to each attribute
 * @property {string} [suffix]         - Suffix to be added to each attribute
 * @property {string} [separator]      - Separator to be used when adding prefix or suffix. defaults to _
 */

/**
 * Structure to map custom fields for rendering. This is used to identofy the attributes for various purposes.
 *
 * @typedef FieldMapping
 * @property {string} [id='id']              Unique id for the item
 * @property {string} [text='text']          the text to render
 * @property {string} [value='value']        the value associated with the item
 * @property {string} [url='url']            a URL
 * @property {string} [icon='icon']          icon to render
 * @property {string} [image='image']        the image to render
 * @property {string} [children='children']  children of the item
 * @property {string} [summary='summary']    summary of the item
 * @property {string} [notes='notes']        notes for the item
 * @property {string} [props='props']        additional properties
 * @property {string} [isOpen='_open']       item is open or closed
 * @property {string} [level='level']        level of item
 * @property {string} [parent='parent']      item is a parent
 * @property {string} [currency='currency]   column specifying currency to be used for the current value
 * @property {string} [isDeleted='_deleted'] item is deleted
 * @property {FieldMapping} [fields]         Field mapping to be used on children in the next level
 */

/**
 * Column metadata for the table.
 *
 * @typedef {Object} ColumnMetadata
 *
 * @property {string} name                    - The name of the column.
 * @property {string} type                - The data type of the column (e.g., "string", "number", "date").
 * @property {FieldMapping} [fields]          - Additional attributes for the column.
 * @property {number} [digits=0]              - The number of digits for numeric values (defaults to 0).
 * @property {Function} formatter             - A function to format the column value.
 * @property {boolean} [sortable]             - Indicates if the column is sortable (true/false).
 * @property {SortOptions} [sortOrder]        - The sort order of the column.
 * @property {HorizontalAlignOptions} [align] - The alignment of the column content.
 * @property {ActionTypes} [action]           - Action attribute for action columns.
 */

/**
 * @typedef {Array<ColumnMetadata>} Metadata
 */

/**
 * @typedef {Object<string,number} ColumnIndexMap
 */

/**
 * Track the state of a row in the table.
 *
 * @typedef {Object} RowState
 * @property {number} row                - Reference to actual row in the data.
 * @property {number} depth              - The depth of the node in the hierarchy.
 * @property {string} [value]            - The value of the hierarchy node.
 * @property {boolean} [isHidden]        - Indicates whether the node is visible (true/false).
 * @property {boolean} [isParent]        - Indicates if this node is a parent (true/false).
 * @property {boolean} [isExpanded]      - Indicates whether the node is expanded (true/false).
 * @property {number} [parent]           - Reference to the parent node in the flat list.
 * @property {SelectionState} [selected] - Indicates whether the node is selected (true/false/indeterminate).
 * @property {Array<any>} children       - Reference to the children nodes in the flat list.
 */

/**
 * Track the state of all rows in the table.
 *
 * @typedef {Object} RowStateMap
 * @property {RowState[]} rows - Flat list of hierarchy nodes.
 */

/**
 * DataFrame-like object with data manipulation methods.
 *
 * @typedef {Object} DataFrame
 * @property {Array<Object>} data     - Array of objects representing the rows of data.
 * @property {Metadata} metadata      - Array of column metadata for the data.
 * @property {ColumnIndexMap} columns - A map of column names to their index in the metadata.
 * @property {Function} [filter]      - Method to filter the DataFrame by a condition.
 * @property {Function} sortBy        - Method to sort the DataFrame by specified columns.
 * @property {Function} groupBy       - Method to group the DataFrame by specified columns.
 * @property {Function} where         - Sets the filter function for the DataFrame
 * @property {Function} join          - Method to join the DataFrame with another DataFrame.
 * @property {Function} innerJoin     - Method to perform an inner join with another DataFrame.
 * @property {Function} outerJoin     - Method to perform an outer join with another DataFrame.
 * @property {Function} fullJoin      - Method to perform a full join with another DataFrame.
 * @property {Function} nestedJoin    - Method to perform a nested join with another DataFrame.
 * @property {Function} select        - Method to select the columns of the DataFrame.
 * @property {Function} rename        - Method to rename the columns of the DataFrame.
 * @property {Function} drop          - Method to drop the columns of the DataFrame.
 * @property {Function} delete        - Method to delete the rows of the DataFrame.
 * @property {Function} update        - Method to update the rows of the DataFrame.
 * @property {Function} union         - Method to combine the rows of the DataFrame with another DataFrame.
 * @property {Function} minus         - Method to remove the rows of the DataFrame which are present in another DataFrame.
 * @property {Function} intersect     - Method to keep the rows of the DataFrame which are present in another DataFrame.
 */

/**
 * @typedef {inner|outer|full|nested} JoinType
 */
/**
 * Options for joining two data sets
 *
 * @typedef JoinOptions
 * @property {boolean} [inner]                - Flag indicating inner join
 * @property {JoinType} [type='inner]         - The join type to use (inner, outer, full, nested).
 * @property {string} [prefix]                - prefix to be used for renaming keys in the second data set.
 * @property {string} [suffix]                - suffix to be used for renaming keys in the second data set.
 * @property {string} [separator='_']         - separator to be used for renaming keys in the second data set.
 */
export {}
