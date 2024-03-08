# Dataframe

The DataFrame UI Library is a JavaScript library that provides a set of tools for managing and manipulating data in user interfaces. It is framework agnostic and can be used with any ui framework.

- Use the `createView` function to make a data view that lets you change and watch the data.
- With this view, you can sort, filter, and group data, and keep an eye on which rows are selected or hidden.
- The original data stays unchanged, and the view offers different ways to show the data.
- Actions like select, edit, and delete can be linked to data rows with action columns in the view.
- Pick a primary key column to uniquely identify each row.
- The view helps you manage data with parent-child links, even when your data is in a flat array.
- Combine data from different views with join and merge features.
- Create connected data views with joins to map out how data relates, especially for tracking parent-child bonds.

## Example

Here's how to use the `createView` function from the DataFrame UI Library in a function-based approach:

```javascript
import { createView } from '@jerrythomas/dataframe'

// Sample data
const data = [
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 }
  // more data...
]

// Create a new view of the data
const view = createView(data)

// Sort the data by the 'name' field
view.sortBy('name')

// Filter data to only include top-level items
view.filter((row) => row.age > 25)
```

The `createView` function initializes a manageable data state with methods that allow for manipulation and observation of data changes, integrating smoothly with UI updates.
