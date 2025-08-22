```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "itemsData_selected",
      "update": "data('itemsData_selected')"
    },
    {
      "name": "itemsData_selected_sum_price",
      "update": "data('itemsData_selected_sum_price')"
    },
    {
      "name": "total",
      "value": 0,
      "update": "format(data('itemsData_selected_sum_price')[0] ? data('itemsData_selected_sum_price')[0].sum_price : 0, ',.2f')"
    },
    {
      "name": "itemsData",
      "update": "data('itemsData')"
    }
  ],
  "data": [
    {
      "name": "itemsData",
      "values": [
        {
          "item": "Apples",
          "category": "Fruits",
          "price": 1.2
        },
        {
          "item": "Bananas",
          "category": "Fruits",
          "price": 0.5
        },
        {
          "item": "Oranges",
          "category": "Fruits",
          "price": 0.8
        },
        {
          "item": "Strawberries",
          "category": "Fruits",
          "price": 2.5
        },
        {
          "item": "Grapes",
          "category": "Fruits",
          "price": 2.2
        },
        {
          "item": "Bread",
          "category": "Bakery",
          "price": 2
        },
        {
          "item": "Bagels",
          "category": "Bakery",
          "price": 1.8
        },
        {
          "item": "Croissant",
          "category": "Bakery",
          "price": 2.3
        },
        {
          "item": "Milk",
          "category": "Dairy",
          "price": 1.5
        },
        {
          "item": "Cheese",
          "category": "Dairy",
          "price": 3
        },
        {
          "item": "Yogurt",
          "category": "Dairy",
          "price": 1.1
        },
        {
          "item": "Eggs",
          "category": "Dairy",
          "price": 2.4
        },
        {
          "item": "Chicken Breast",
          "category": "Meat",
          "price": 5
        },
        {
          "item": "Ground Beef",
          "category": "Meat",
          "price": 4.5
        },
        {
          "item": "Salmon",
          "category": "Meat",
          "price": 7
        },
        {
          "item": "Carrots",
          "category": "Vegetables",
          "price": 0.9
        },
        {
          "item": "Broccoli",
          "category": "Vegetables",
          "price": 1.3
        },
        {
          "item": "Lettuce",
          "category": "Vegetables",
          "price": 1
        },
        {
          "item": "Tomatoes",
          "category": "Vegetables",
          "price": 1.2
        },
        {
          "item": "Potatoes",
          "category": "Vegetables",
          "price": 0.7
        },
        {
          "item": "Pasta",
          "category": "Pantry",
          "price": 1.1
        },
        {
          "item": "Rice",
          "category": "Pantry",
          "price": 1
        },
        {
          "item": "Cereal",
          "category": "Pantry",
          "price": 2.8
        },
        {
          "item": "Olive Oil",
          "category": "Pantry",
          "price": 4
        }
      ]
    },
    {
      "name": "itemsData_selected",
      "values": []
    },
    {
      "name": "itemsData_selected_sum_price",
      "source": [
        "itemsData_selected"
      ],
      "transform": [
        {
          "type": "aggregate",
          "ops": [
            "sum"
          ],
          "fields": [
            "price"
          ],
          "as": [
            "sum_price"
          ]
        }
      ]
    }
  ]
}
```

```css
html, body { height: 100%; margin: 0; padding: 0; scroll-behavior: smooth; overflow-y: auto; }
body { scroll-snap-type: y mandatory; }
.group { color: white; scroll-snap-align: start; height: 100vh; margin: 0; padding: 1em; box-sizing: border-box; }
#slide1 { background: #1abc9c; }
#slide2 { background: #3498db; }
#slide3 { background: #9b59b6; }
#slide4 { background: #e74c3c; }
```

::: group {#slide1}
## Welcome to the Shopping List App

:::

::: group {#slide2}
## Here you can select items to buy from a variety of categories.


### Categories include Fruits, Bakery, Dairy, Meat, Vegetables, and Pantry items.


### You can select multiple items and see the total price calculated automatically.
:::

::: group {#slide3}
## Let's start by selecting some items from the list below.


### Click on the checkboxes next to the items you want to add to your shopping list.
:::

::: group {#slide4}
## Select the items you want to buy


```json tabulator
{
  "dataSourceName": "itemsData",
  "variableId": "itemsData_selected",
  "tabulatorOptions": {
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
}
```

## Total Price

${{total}}

### Categories

```json vega-lite
{
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
```
:::