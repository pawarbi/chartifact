```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "img_height",
      "value": "300"
    },
    {
      "name": "img_width",
      "value": "400"
    },
    {
      "name": "img_url",
      "value": "https://picsum.photos/400/300"
    }
  ]
}
```

## Server-Generated Images

Images are particularly powerful for server-side generated visualizations:

- **Python plots** - matplotlib, seaborn, plotly exports

- **R visualizations** - ggplot2, base R graphics

- **Dynamic charts** - generated based on current data

- **Custom graphics** - any server-side image generation



Example server endpoint: `/api/regressionplot?target={{targetVariable}}&model={{modelType}}&theme={{colorTheme}}`



Images support dynamic URLs with query parameters and can be regenerated in real-time.

*samples below provided by [picsum.photos](https://picsum.photos/)*

## Complete URL Variable

You can use a single variable for the entire image URL. No URL encoding is applied to the value.

```json dropdown
{
  "variableId": "img_url",
  "value": "https://picsum.photos/400/300",
  "options": [
    "https://picsum.photos/100/100",
    "https://picsum.photos/200/200",
    "https://picsum.photos/300/300",
    "https://picsum.photos/400/300",
    "https://picsum.photos/400/400"
  ]
}
```

```json image
{
  "url": "{{img_url}}",
  "alt": "Complete URL variable example"
}
```

## URL Segments

You can construct image URLs from multiple variables. Each segment is encoded using `encodeURIComponent`.

```json dropdown
{
  "variableId": "img_height",
  "value": "300",
  "options": [
    "100",
    "200",
    "300",
    "400"
  ]
}
```

```json dropdown
{
  "variableId": "img_width",
  "value": "400",
  "options": [
    "100",
    "200",
    "300",
    "400"
  ]
}
```

```json image
{
  "url": "https://picsum.photos/{{img_width}}/{{img_height}}",
  "alt": "URL segments example"
}
```