# JSON vs YAML Comparison

This document shows the same functionality implemented in both JSON and YAML to demonstrate the differences.

## JSON Version

```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Sales by quarter",
  "data": {
    "values": [
      {"quarter": "Q1", "sales": 120000, "profit": 15000},
      {"quarter": "Q2", "sales": 135000, "profit": 18000},
      {"quarter": "Q3", "sales": 142000, "profit": 22000},
      {"quarter": "Q4", "sales": 158000, "profit": 28000}
    ]
  },
  "mark": {
    "type": "bar",
    "color": "#2E86AB"
  },
  "encoding": {
    "x": {
      "field": "quarter",
      "type": "nominal",
      "axis": {"title": "Quarter"}
    },
    "y": {
      "field": "sales",
      "type": "quantitative",
      "axis": {"title": "Sales ($)", "format": "$,.0f"}
    },
    "tooltip": [
      {"field": "quarter", "type": "nominal"},
      {"field": "sales", "type": "quantitative", "format": "$,.0f"},
      {"field": "profit", "type": "quantitative", "format": "$,.0f"}
    ]
  }
}
```

## YAML Version

```yaml vega-lite
$schema: "https://vega.github.io/schema/vega-lite/v5.json"
description: "Sales by quarter"
data:
  values:
    - quarter: "Q1"
      sales: 120000
      profit: 15000
    - quarter: "Q2"
      sales: 135000
      profit: 18000
    - quarter: "Q3"
      sales: 142000
      profit: 22000
    - quarter: "Q4"
      sales: 158000
      profit: 28000
mark:
  type: "bar"
  color: "#2E86AB"
encoding:
  x:
    field: "quarter"
    type: "nominal"
    axis:
      title: "Quarter"
  y:
    field: "sales"
    type: "quantitative"
    axis:
      title: "Sales ($)"
      format: "$,.0f"
  tooltip:
    - field: "quarter"
      type: "nominal"
    - field: "sales"
      type: "quantitative"
      format: "$,.0f"
    - field: "profit"
      type: "quantitative"
      format: "$,.0f"
```

## Key Differences

| Aspect | JSON | YAML |
|--------|------|------|
| Syntax | Uses brackets `{}` and commas | Uses indentation and dashes |
| Readability | More verbose | More concise and readable |
| Data arrays | `[{"key": "value"}]` | `- key: "value"` |
| Nesting | Bracket-based | Indentation-based |
| Quotes | Required for all strings | Optional for simple strings |

Both versions produce identical functionality - choose the format that works best for your team and use case!