```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "jsonTable",
      "update": "data('jsonTable')"
    },
    {
      "name": "anything",
      "value": "abc"
    },
    {
      "name": "url:0:http___127_0_0_1_8000___anything___json",
      "update": "'http://127.0.0.1:8000/' + encodeURIComponent(anything) + '.json'"
    },
    {
      "name": "jsonData",
      "update": "data('jsonData')"
    }
  ],
  "data": [
    {
      "name": "jsonData",
      "url": {
        "signal": "url:0:http___127_0_0_1_8000___anything___json"
      },
      "format": {
        "type": "json"
      }
    },
    {
      "name": "jsonTable",
      "values": []
    }
  ]
}
```

## Data Sources
Load data from JSON, CSV, TSV, or URLs with optional transformations.

### JSON Data

```json dropdown
{
  "variableId": "anything",
  "value": "abc",
  "options": [
    "abc",
    "def"
  ]
}
```

```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {
    "name": "jsonData"
  },
  "mark": "bar",
  "encoding": {
    "x": {
      "field": "category"
    },
    "y": {
      "field": "value",
      "type": "quantitative"
    },
    "xOffset": {
      "field": "group"
    },
    "color": {
      "field": "group"
    }
  }
}
```

```json tabulator
{
  "dataSourceName": "jsonData",
  "variableId": "jsonTable",
  "tabulatorOptions": {
    "autoColumns": true,
    "layout": "fitColumns",
    "maxHeight": "100px"
  }
}
```