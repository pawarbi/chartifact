export const sample = `# Seattle Weather

Here is a stacked bar chart of Seattle weather:
Each bar represents the count of weather types for each month.
The colors distinguish between different weather conditions such as sun, fog, drizzle, rain, and snow.

\`\`\`json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"url": "https://vega.github.io/editor/data/seattle-weather.csv"},
  "mark": "bar",
  "encoding": {
    "x": {
      "timeUnit": "month",
      "field": "date",
      "type": "ordinal",
      "title": "Month of the year"
    },
    "y": {
      "aggregate": "count",
      "type": "quantitative"
    },
    "color": {
      "field": "weather",
      "type": "nominal",
      "scale": {
        "domain": ["sun", "fog", "drizzle", "rain", "snow"],
        "range": ["#e7ba52", "#c7c7c7", "#aec7e8", "#1f77b4", "#9467bd"]
      },
      "title": "Weather type"
    }
  }
}
\`\`\`
`;

export const htmlMarkdownWrapper = (markdown: string) => `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mdv test</title>
    <link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css" rel="stylesheet" />

    <script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega@5.29.0"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1"></script>
    <script src="https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js"></script>

    <!-- TODO: use CDN version -->
    <script src="../../../../packages/renderer/dist/umd/idocs.umd.js"></script>

</head>

<body>

    <textarea id="markdown-input" style="display:none">${markdown}</textarea>

    <div id="content"></div>

    <script>
        IDocs.bindTextarea(document.getElementById('markdown-input'), document.getElementById('content'));
    </script>

</body>

</html>`;
