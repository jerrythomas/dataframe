# Dataframe

[![Test Coverage][coverage_badge]][coverage_url]
[![Maintainability][maintainability_badge]][maintainability_url]

The DataFrame UI Library is a JavaScript library that provides a set of tools for managing and manipulating data in user interfaces. It is framework agnostic and can be used with any ui framework.

## Features

- **Datasets:** Manage and manipulate datasets with ease
  - filtering, sorting, and aggregation.
  - **Joins:** Combine datasets effortlessly with support for inner, outer, left, and right joins.
  - **Rollup:** Summarize data across multiple dimensions, calculating aggregate statistics like sum, average, min, and max.
- **Modeling:** Create and manage data models, including merging, renaming, and resolving conflicts.
- **Renaming:** Simplify key renaming in JavaScript objects, with options for prefixes, suffixes, and custom separators.
- **Dataviews:** Create interactive views for exploring and analyzing datasets, including sortable and filterable columns.

## Dataset

- The `dataset` function initializes a dataset from an array of objects.
- This dataset comprises data rows that are sortable, filterable, and groupable.
- Leverage dataset for SQL-like operations such as selecting, updating, and deleting rows.
- Employ aggregate functions like sum, average, and count for summarizing multiple attributes of the data.
- Utilize the dataset for various data operations like joining and merging data from disparate sources.
- Establish connected data views with joins to visualize data relationships, particularly for tracking parent-child connections.

Refer to [dataset](docs/dataset.md) documentation for more details.

## DataView

- Utilize the `dataview` function to create a data view, enabling dynamic data manipulation and observation.
- This view facilitates sorting, filtering, and grouping data while providing insight into selected or hidden rows.
- The original dataset remains untouched while the view offers flexible data presentation options.
- Associate actions such as select, edit, and delete with data rows using action columns within the view.
- Manage data effectively, including parent-child links, even within a flat array structure.

Refer to [dataview](docs/dataview.md) documentation for more details.

## Example

Here's how to use the `dataview` function from the DataFrame UI Library in a function-based approach:

```javascript
import { dataview } from '@jerrythomas/dataframe'

// Sample data
const data = [
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 }
  // more data...
]

// Create a new view of the data
const view = dataview(data)

// Sort the data by the 'name' field
view.sortBy('name')

// Filter data to only include top-level items
view.filter((row) => row.age > 25)
```

The `dataview` function initializes a manageable data state with methods that allow for manipulation and observation of data changes, integrating smoothly with UI updates.

[coverage_badge]: https://api.codeclimate.com/v1/badges/165df677f6d552814a33/test_coverage
[coverage_url]: https://codeclimate.com/github/jerrythomas/dataframe/test_coverage
[maintainability_badge]: https://api.codeclimate.com/v1/badges/165df677f6d552814a33/maintainability
[maintainability_url]: https://codeclimate.com/github/jerrythomas/dataframe/maintainability
