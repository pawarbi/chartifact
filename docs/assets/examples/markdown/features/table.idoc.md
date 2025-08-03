```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "table1",
      "update": "data('table1')"
    },
    {
      "name": "table2",
      "update": "data('table2')"
    },
    {
      "name": "sampleData",
      "update": "data('sampleData')"
    }
  ],
  "data": [
    {
      "name": "sampleData",
      "values": [
        {
          "name": "Alice",
          "age": 25,
          "city": "New York"
        },
        {
          "name": "Bob",
          "age": 30,
          "city": "Chicago"
        },
        {
          "name": "Carol",
          "age": 35,
          "city": "Los Angeles"
        },
        {
          "name": "David",
          "age": 28,
          "city": "Seattle"
        }
      ]
    },
    {
      "name": "table2",
      "values": []
    },
    {
      "name": "table1",
      "values": []
    }
  ]
}
```

## Table
Use tables for displaying and interacting with tabular data.

### Basic Table

```json tabulator
{
  "dataSourceName": "sampleData",
  "variableId": "table1",
  "tabulatorOptions": {
    "autoColumns": true,
    "layout": "fitColumns",
    "maxHeight": "200px"
  }
}
```

### Selectable Table

```json tabulator
{
  "dataSourceName": "sampleData",
  "variableId": "table2",
  "tabulatorOptions": {
    "autoColumns": true,
    "layout": "fitColumns",
    "maxHeight": "200px",
    "selectableRows": true,
    "rowHeader": {
      "formatter": "rowSelection",
      "titleFormatter": "rowSelection",
      "headerSort": false,
      "headerHozAlign": "center",
      "hozAlign": "center",
      "width": 40
    }
  }
}
```