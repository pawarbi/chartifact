import { InteractiveDocumentWithSchema } from './dsl';

export const sampleMarkdown = `# Seattle Weather

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

export const sampleInteractiveDocumentWithSchema: InteractiveDocumentWithSchema = {
    "$schema": "../../schema/v1.json",
    "title": "Select Items to Buy",
    "dataLoaders": [
        {
            "dataSourceName": "itemsData",
            "type": "json",
            "content": [
                {"item": "Apples", "category": "Fruits", "price": 1.20},
                {"item": "Bananas", "category": "Fruits", "price": 0.50},
                {"item": "Oranges", "category": "Fruits", "price": 0.80},
                {"item": "Strawberries", "category": "Fruits", "price": 2.50},
                {"item": "Grapes", "category": "Fruits", "price": 2.20},
                {"item": "Bread", "category": "Bakery", "price": 2.00},
                {"item": "Bagels", "category": "Bakery", "price": 1.80},
                {"item": "Croissant", "category": "Bakery", "price": 2.30},
                {"item": "Milk", "category": "Dairy", "price": 1.50},
                {"item": "Cheese", "category": "Dairy", "price": 3.00},
                {"item": "Yogurt", "category": "Dairy", "price": 1.10},
                {"item": "Eggs", "category": "Dairy", "price": 2.40},
                {"item": "Chicken Breast", "category": "Meat", "price": 5.00},
                {"item": "Ground Beef", "category": "Meat", "price": 4.50},
                {"item": "Salmon", "category": "Meat", "price": 7.00},
                {"item": "Carrots", "category": "Vegetables", "price": 0.90},
                {"item": "Broccoli", "category": "Vegetables", "price": 1.30},
                {"item": "Lettuce", "category": "Vegetables", "price": 1.00},
                {"item": "Tomatoes", "category": "Vegetables", "price": 1.20},
                {"item": "Potatoes", "category": "Vegetables", "price": 0.70},
                {"item": "Pasta", "category": "Pantry", "price": 1.10},
                {"item": "Rice", "category": "Pantry", "price": 1.00},
                {"item": "Cereal", "category": "Pantry", "price": 2.80},
                {"item": "Olive Oil", "category": "Pantry", "price": 4.00}
            ]
        }
    ],
    "variables": [
        {
            "variableId": "itemsData_selected_sum_price",
            "type": "object",
            "isArray": true,
            "initialValue": [],
            "calculation": {
                "dependsOn": [
                    "itemsData_selected"
                ],
                "dataFrameTransformations": [
                    {
                        "type": "aggregate",
                        "ops": ["sum"],
                        "fields": ["price"],
                        "as": ["sum_price"]
                    }
                ]
            }
        },
        {
            "variableId": "total",
            "type": "number",
            "initialValue": 0,
            "calculation": {
                "vegaExpression": "format(data('itemsData_selected_sum_price')[0] ? data('itemsData_selected_sum_price')[0].sum_price : 0, ',.2f')"
            }
        }
    ],
    "groups": [
        {
            "groupId": "main",
            "elements": [
                "## Select the items you want to buy\n",
                {
                    "type": "table",
                    "dataSourceName": "itemsData",
                    "options": {
                        "autoColumns": true,
                        "layout": "fitColumns",
                        "minHeight": "200px",
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
                },
                "## Total Price\n\n${{total}}\n\n### Categories",
                {
                    "type": "chart",
                    "chart": {
                        "chartIntent": "Show category distribution of selected items",
                        "chartTemplateKey": "bar",
                        "dataSourceBase": {
                            "dataSourceName": "itemsData_selected"
                        },
                        "spec": {
                            "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
                            "data": {
                                "name": "itemsData_selected"
                            },
                            "mark": "bar",
                            "encoding": {
                                "x": {
                                    "field": "category",
                                    "type": "nominal",
                                    "title": "Category"
                                },
                                "y": {
                                    "aggregate": "count",
                                    "type": "quantitative",
                                    "title": "Number of Items"
                                },
                                "color": {
                                    "field": "category",
                                    "type": "nominal",
                                    "legend": {
                                        "title": "Category"
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        }
    ]
};
