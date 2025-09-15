```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    { "name": "threshold", "value": 0.5 },
    { "name": "selectedFeature", "value": "age" },
    { "name": "selectedFeatureTitle", "update": "selectedFeature === 'age' ? 'Age' : 'Income'" },
    { "name": "modelData", "update": "data('modelData')" },
    { "name": "confusion", "update": "data('confusion')" },
    { "name": "scatterData", "update": "data('scatterData')" },
    { "name": "featureImportance", "update": "data('featureImportance')" }
  ],
  "data": [
    {
      "name": "modelData",
      "values": [
        { "id": 1, "age": 25, "income": 50000, "actual": 1, "prob": 0.8 },
        { "id": 2, "age": 45, "income": 80000, "actual": 0, "prob": 0.1 },
        { "id": 3, "age": 35, "income": 60000, "actual": 1, "prob": 0.4 },
        { "id": 4, "age": 52, "income": 120000, "actual": 0, "prob": 0.6 },
        { "id": 5, "age": 23, "income": 40000, "actual": 1, "prob": 0.9 },
        { "id": 6, "age": 31, "income": 70000, "actual": 0, "prob": 0.2 },
        { "id": 7, "age": 40, "income": 90000, "actual": 1, "prob": 0.7 },
        { "id": 8, "age": 28, "income": 55000, "actual": 0, "prob": 0.3 },
        { "id": 9, "age": 60, "income": 110000, "actual": 1, "prob": 0.45 },
        { "id": 10, "age": 48, "income": 95000, "actual": 0, "prob": 0.65 },
        { "id": 11, "age": 36, "income": 62000, "actual": 1, "prob": 0.85 },
        { "id": 12, "age": 29, "income": 52000, "actual": 0, "prob": 0.25 }
      ],
      "transform": [
        { "type": "formula", "expr": "datum.prob >= threshold ? 1 : 0", "as": "prediction" }
      ]
    },
    {
      "name": "confusion",
      "source": "modelData",
      "transform": [
        { "type": "aggregate", "groupby": ["actual", "prediction"], "ops": ["count"], "as": ["count"] }
      ]
    },
    {
      "name": "scatterData",
      "source": "modelData",
      "transform": [
        { "type": "formula", "expr": "datum[selectedFeature]", "as": "featureValue" }
      ]
    },
    {
      "name": "featureImportance",
      "values": [
        { "feature": "age", "importance": 0.55 },
        { "feature": "income", "importance": 0.45 }
      ]
    }
  ]
}
```

# Model Interpretability Dashboard

### Adjust Classification Threshold

```yaml slider
variableId: threshold
min: 0
max: 1
step: 0.05
value: 0.5
```

### Confusion Matrix

```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": { "name": "confusion" },
  "mark": "rect",
  "encoding": {
    "x": { "field": "prediction", "type": "nominal", "title": "Predicted" },
    "y": { "field": "actual", "type": "nominal", "title": "Actual" },
    "color": { "field": "count", "type": "quantitative", "title": "Count" }
  }
}
```

### Feature Importance

```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": { "name": "featureImportance" },
  "mark": "bar",
  "encoding": {
    "x": { "field": "feature", "type": "nominal", "title": "Feature" },
    "y": { "field": "importance", "type": "quantitative", "title": "Importance" },
    "color": { "field": "feature", "type": "nominal", "legend": null }
  }
}
```

### Probability vs {{selectedFeatureTitle}}

```yaml dropdown
variableId: selectedFeature
options:
  - label: Age
    value: age
  - label: Income
    value: income
```

```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": { "name": "scatterData" },
  "mark": "point",
  "encoding": {
    "x": { "field": "featureValue", "type": "quantitative", "title": {"signal": "selectedFeatureTitle"} },
    "y": { "field": "prob", "type": "quantitative", "title": "Predicted Probability" },
    "color": { "field": "actual", "type": "nominal", "title": "Actual" }
  }
}
```

### Data

```json tabulator
{
  "dataSourceName": "modelData",
  "tabulatorOptions": {
    "autoColumns": true,
    "layout": "fitColumns",
    "minHeight": "200px",
    "maxHeight": "200px"
  }
}
```
