# YAML Example Document

This document demonstrates YAML syntax support in chartifact.

```yaml vega
$schema: "https://vega.github.io/schema/vega/v5.json"
description: "Interactive temperature dashboard"
signals:
  - name: "selectedCity"
    value: "New York"
  - name: "temperature"
    value: 22
  - name: "showGrid"
    value: true
data:
  - name: "weather"
    values:
      - city: "New York"
        temperature: 22
        humidity: 65
      - city: "Los Angeles"
        temperature: 28
        humidity: 45
      - city: "Chicago"
        temperature: 18
        humidity: 70
```

## User Controls

Select a city to view its weather data:

```yaml dropdown
variableId: "selectedCity"
value: "New York"
label: "Choose a city"
options:
  - "New York"
  - "Los Angeles"
  - "Chicago"
```

Adjust the temperature:

```yaml slider
variableId: "temperature"
value: 22
label: "Temperature (°C)"
min: -10
max: 40
step: 1
```

Toggle grid display:

```yaml checkbox
variableId: "showGrid"
value: true
label: "Show grid lines"
```

## Weather Chart

```yaml vega-lite
$schema: "https://vega.github.io/schema/vega-lite/v5.json"
description: "Temperature by city"
data:
  name: "weather"
mark:
  type: "bar"
  color: "#1f77b4"
encoding:
  x:
    field: "city"
    type: "nominal"
    axis:
      title: "City"
  y:
    field: "temperature"
    type: "quantitative"
    axis:
      title: "Temperature (°C)"
      grid: 
        signal: "showGrid"
```

This example shows how YAML makes the configuration more readable and easier to maintain compared to JSON.