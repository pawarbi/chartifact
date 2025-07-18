# Chartifact

**Declarative, interactive data documents**

Chartifact is a low-code document format for creating interactive, data-driven pages such as reports, dashboards, and presentations. It travels like a document and works like an app. Easily editable and remixable, it’s a file type for an AI-native world.

## Features

* A **library of components** — charts, inputs, tables, images, text, and layout elements — defined declaratively and wired together with reactive variables:

  * **Inputs** – Textboxes, checkboxes, sliders, dropdowns
  * **Charts** – Vega and Vega-Lite visualizations
  * **Tables** – Sortable, filterable, and selectable data grids
  * **Images** – Dynamic image URLs based on variables
  * **Text** – Markdown with dynamic placeholders
  * **Presets** – Named sets of variable values for quick scenario switching

* A **VS Code extension** for editing, previewing, and exporting documents, with optional AI assistance.

* A **web-based viewer and editor** for quick edits and sharing.

* Tools to **export standalone HTML** documents you can share or embed anywhere.

---

## Authoring Formats

Chartifact documents can be written in two formats:

* **Markdown** – Human-readable, easy to write and review. Interactive elements are embedded as fenced JSON blocks.
* **JSON** – Structured and precise. Ideal for programmatic generation or when working directly with the document schema.

Both formats are functionally equivalent and supported across all tooling.

## AI Support

The format is designed with AI assistance in mind:

* Structured syntax makes documents easy to edit and generate with LLMs
* In-editor tools like Ctrl+I and agent mode available in VS Code
* HTML exports retain semantic structure for downstream AI tools

This enables both authoring and remixing workflows with language models and agent-based tooling.

## Data Flow

The document runtime is reactive. Components stay in sync through a shared set of variables:

* **Reactive variables** update elements and data sources automatically
* **Dynamic bindings** let variables appear in chart specs, text, URLs, and API calls
* **REST integration** supports fetching data from external sources
* **Vega transforms** provide built-in tools for reshaping data
* **Signal bus** coordinates state across all components

Chartifact documents behave like small reactive systems — without custom JavaScript.

## Styling

Styling is done using scoped CSS blocks embedded in the document. This allows flexible layout and visual design without global side effects:

* Style documents as articles, dashboards, or slides
* Use CSS to control layout and theming
* No raw HTML injection or global styles

The predictable, declarative nature of the styling model makes it easy for both humans and LLMs to work with.

## Security

Chartifact is designed to be safe by default:

* No custom JavaScript execution
* CSP-compliant via Vega expression language
* No raw HTML in Markdown
* Rendered in sandboxed iframes to isolate execution

These constraints help ensure portability and safe embedding in various environments.
