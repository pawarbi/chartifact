```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "imageSize",
      "value": 300
    },
    {
      "name": "imageCategory",
      "value": "nature"
    },
    {
      "name": "seed",
      "value": 123
    }
  ]
}
```

## URLs
Construct dynamic URLs using variables in paths and query parameters.

```json slider
{"variableId":"imageSize","value":300,"label":"Image size:","min":100,"max":600,"step":50}
```

```json dropdown
{
  "variableId": "imageCategory",
  "value": "nature",
  "label": "Category:",
  "options": [
    "nature",
    "city",
    "technology",
    "abstract"
  ]
}
```

```json slider
{"variableId":"seed","value":123,"label":"Random seed:","min":1,"max":1000,"step":1}
```

### Basic URL Construction

URLs are built with `origin` + `urlPath`:

```json image
{
  "url": "https://picsum.photos/{{imageSize}}",
  "alt": "Dynamic image example",
  "width": 400,
  "height": 300
}
```

Current URL: `https://picsum.photos/{{imageSize}}`

### URL with Query Parameters

Use `mappedParams` to add variables as query parameters:

```json image
{
  "url": "https://picsum.photo/{{imageSize}}?category={{imageCategory}}&seed={{seed}}",
  "alt": "Image with query parameters",
  "width": 400,
  "height": 300
}
```

Current URL: `https://picsum.photos/{{imageSize}}?category={{imageCategory}}&seed={{seed}}`

### Usage in Data Sources

URLs work the same way for loading data - origin, path, and optional query parameters with variables.