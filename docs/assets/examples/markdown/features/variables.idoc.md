```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "userName",
      "value": "Alice"
    },
    {
      "name": "temperature",
      "value": 20
    },
    {
      "name": "isEnabled",
      "value": true
    },
    {
      "name": "obj",
      "value": {
        "foo": "bar",
        "value": 42
      }
    },
    {
      "name": "doubled_temperature",
      "value": 40,
      "update": "temperature * 2"
    },
    {
      "name": "value",
      "value": 42,
      "update": "obj.value"
    }
  ]
}
```

## Variables
Variables store values that can be referenced in markdown using `{{variableName}}` syntax.

**String:** Hello, **{{userName}}**!

**Number:** The count is **{{temperature}}**

**Boolean:** Feature status: **{{isEnabled}}**

**Object:** `obj` = JSON object with foo and value properties

**Calculated:** Count doubled is **{{doubled_temperature}}**

**Calculated:** Value from object: **{{value}}**