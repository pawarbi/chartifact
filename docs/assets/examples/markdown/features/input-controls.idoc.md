```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "isEnabled",
      "value": true
    },
    {
      "name": "userName",
      "value": "John Doe"
    },
    {
      "name": "temperature",
      "value": 20
    },
    {
      "name": "opacity",
      "value": 0.5
    },
    {
      "name": "selectedColor",
      "value": "blue"
    },
    {
      "name": "selectedItems",
      "value": [
        "apple",
        "banana"
      ]
    }
  ]
}
```

## Input Controls

Hello **{{userName}}**! Feature enabled: **{{isEnabled}}**. Temperature: **{{temperature}}°C**. Color: **{{selectedColor}}**. Items: **{{selectedItems}}**.

### Checkbox

```json checkbox
{"variableId":"isEnabled","value":true,"label":"Enable feature"}
```

### Textbox

```json textbox
{"variableId":"userName","value":"John Doe","label":"Name:"}
```

### Slider

```json slider
{"variableId":"temperature","value":20,"label":"Temperature:","min":-10,"max":40,"step":1}
```

### Dropdown

```json dropdown
{
  "variableId": "selectedColor",
  "value": "blue",
  "label": "Color:",
  "options": [
    "red",
    "green",
    "blue",
    "yellow"
  ]
}
```

```json dropdown
{
  "variableId": "selectedItems",
  "value": [
    "apple",
    "banana"
  ],
  "label": "Items:",
  "options": [
    "apple",
    "banana",
    "orange",
    "grape"
  ],
  "multiple": true,
  "size": 3
}
```