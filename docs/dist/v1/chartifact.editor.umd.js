(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("vega"), require("react")) : typeof define === "function" && define.amd ? define(["exports", "vega", "react"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.Chartifact = global.Chartifact || {}, global.vega, global.React));
})(this, (function(exports2, vega, React$1) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  const defaultCommonOptions = {
    dataSignalPrefix: "data_signal:",
    groupClassName: "group"
  };
  function collectIdentifiers(ast) {
    const identifiers = /* @__PURE__ */ new Set();
    function walk(node) {
      if (!node || typeof node !== "object")
        return;
      switch (node.type) {
        case "Identifier":
          if (!VEGA_BUILTIN_FUNCTIONS.includes(node.name)) {
            identifiers.add(node.name);
          }
          break;
        case "CallExpression":
          walk(node.callee);
          (node.arguments || []).forEach(walk);
          break;
        case "MemberExpression":
          walk(node.object);
          break;
        case "BinaryExpression":
        case "LogicalExpression":
          walk(node.left);
          walk(node.right);
          break;
        case "ConditionalExpression":
          walk(node.test);
          walk(node.consequent);
          walk(node.alternate);
          break;
        case "ArrayExpression":
          (node.elements || []).forEach(walk);
          break;
        default:
          for (const key in node) {
            if (node.hasOwnProperty(key)) {
              const value = node[key];
              if (Array.isArray(value))
                value.forEach(walk);
              else if (typeof value === "object")
                walk(value);
            }
          }
      }
    }
    walk(ast);
    return identifiers;
  }
  const VEGA_BUILTIN_FUNCTIONS = Object.freeze([
    // Built-ins from Vega Expression docs
    "abs",
    "acos",
    "asin",
    "atan",
    "atan2",
    "ceil",
    "clamp",
    "cos",
    "exp",
    "expm1",
    "floor",
    "hypot",
    "log",
    "log1p",
    "max",
    "min",
    "pow",
    "random",
    "round",
    "sign",
    "sin",
    "sqrt",
    "tan",
    "trunc",
    "length",
    "isNaN",
    "isFinite",
    "parseFloat",
    "parseInt",
    "Date",
    "now",
    "time",
    "utc",
    "timezoneOffset",
    "quarter",
    "month",
    "day",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
    "year"
  ]);
  function tokenizeTemplate(input) {
    const allVars = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;
    const tokens = [];
    let lastIndex = 0;
    input.replace(allVars, (match, varName, offset) => {
      const staticPart = input.slice(lastIndex, offset);
      if (staticPart) {
        tokens.push({ type: "literal", value: staticPart });
      }
      tokens.push({ type: "variable", name: varName });
      lastIndex = offset + match.length;
      return match;
    });
    const tail = input.slice(lastIndex);
    if (tail) {
      tokens.push({ type: "literal", value: tail });
    }
    return tokens;
  }
  function renderVegaExpression(tokens, funcName = "encodeURIComponent") {
    if (tokens.length === 1 && tokens[0].type === "variable") {
      return tokens[0].name;
    }
    const escape = (str) => `'${str.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
    return tokens.map((token) => token.type === "literal" ? escape(token.value) : `${funcName}(${token.name})`).join(" + ");
  }
  function encodeTemplateVariables(input) {
    const tokens = tokenizeTemplate(input);
    return renderVegaExpression(tokens);
  }
  const index$3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    VEGA_BUILTIN_FUNCTIONS,
    collectIdentifiers,
    defaultCommonOptions,
    encodeTemplateVariables,
    renderVegaExpression,
    tokenizeTemplate
  }, Symbol.toStringTag, { value: "Module" }));
  function safeVariableName(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }
  function getChartType(spec) {
    const $schema = spec == null ? void 0 : spec.$schema;
    if (!$schema) {
      return "vega-lite";
    }
    return $schema.includes("vega-lite") ? "vega-lite" : "vega";
  }
  function topologicalSort(list) {
    var _a;
    const nameToObject = /* @__PURE__ */ new Map();
    const inDegree = /* @__PURE__ */ new Map();
    const graph = /* @__PURE__ */ new Map();
    for (const obj of list) {
      nameToObject.set(obj.variableId, obj);
      inDegree.set(obj.variableId, 0);
      graph.set(obj.variableId, []);
    }
    for (const obj of list) {
      const sources = ((_a = obj.calculation) == null ? void 0 : _a.dependsOn) || [];
      for (const dep of sources) {
        if (!graph.has(dep)) {
          continue;
        }
        graph.get(dep).push(obj.variableId);
        inDegree.set(obj.variableId, inDegree.get(obj.variableId) + 1);
      }
    }
    const queue = [];
    for (const [name, degree] of inDegree.entries()) {
      if (degree === 0)
        queue.push(name);
    }
    const sorted = [];
    while (queue.length) {
      const current = queue.shift();
      sorted.push(nameToObject.get(current));
      for (const neighbor of graph.get(current)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
    if (sorted.length !== list.length) {
      throw new Error("Cycle or missing dependency detected");
    }
    return sorted;
  }
  function createSpecWithVariables(variables, tableElements, stubDataLoaders) {
    const spec = {
      $schema: "https://vega.github.io/schema/vega/v5.json",
      description: "This is the central brain of the page",
      signals: [],
      data: []
    };
    tableElements.forEach((table) => {
      const { variableId } = table;
      spec.signals.push(dataAsSignal(variableId));
      spec.data.unshift({
        name: variableId,
        values: []
      });
    });
    topologicalSort(variables).forEach((v) => {
      if (isDataframePipeline(v)) {
        const { dataFrameTransformations } = v.calculation;
        const data = {
          name: v.variableId,
          source: v.calculation.dependsOn || [],
          transform: dataFrameTransformations
        };
        spec.data.push(data);
        spec.signals.push(dataAsSignal(v.variableId));
      } else {
        const signal = { name: v.variableId, value: v.initialValue };
        if (v.calculation) {
          signal.update = v.calculation.vegaExpression;
        }
        spec.signals.push(signal);
      }
    });
    return spec;
  }
  function isDataframePipeline(variable) {
    var _a, _b;
    return variable.type === "object" && !!variable.isArray && (((_a = variable.calculation) == null ? void 0 : _a.dependsOn) !== void 0 && variable.calculation.dependsOn.length > 0 || ((_b = variable.calculation) == null ? void 0 : _b.dataFrameTransformations) !== void 0 && variable.calculation.dataFrameTransformations.length > 0);
  }
  function ensureDataAndSignalsArray(spec) {
    if (!spec.data) {
      spec.data = [];
    }
    if (!spec.signals) {
      spec.signals = [];
    }
  }
  function dataAsSignal(name) {
    return {
      name,
      update: `data('${name}')`
    };
  }
  function addStaticDataLoaderToSpec(vegaScope, dataSource) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;
    ensureDataAndSignalsArray(spec);
    spec.signals.push(dataAsSignal(dataSourceName));
    const newData = {
      name: dataSourceName,
      values: [],
      transform: dataSource.dataFrameTransformations || []
    };
    if (dataSource.type === "inline") {
      if (dataSource.format === "json") {
        newData.values = dataSource.content;
      } else if (typeof dataSource.content === "string") {
        const data = vega.read(dataSource.content, {
          type: dataSource.format
        });
        if (Array.isArray(data)) {
          newData.values = data;
        } else {
          console.warn(`Unsupported inline data format: ${dataSource.format}, type is ${typeof dataSource.content}`);
        }
      } else {
        console.warn(`Unsupported inline data format: ${dataSource.format}, type is ${typeof dataSource.content}`);
      }
    } else if (dataSource.type === "file") {
      newData.format = {
        type: dataSource.format
      };
      newData.values = [dataSource.content];
    }
    spec.data.unshift(newData);
  }
  function addDynamicDataLoaderToSpec(vegaScope, dataSource) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;
    const tokens = tokenizeTemplate(dataSource.url);
    const variableCount = tokens.filter((token) => token.type === "variable").length;
    let url;
    if (variableCount) {
      const urlSignal = vegaScope.createUrlSignal(dataSource.url, tokens);
      url = { signal: urlSignal.name };
    } else {
      url = dataSource.url;
    }
    ensureDataAndSignalsArray(spec);
    spec.signals.push(dataAsSignal(dataSourceName));
    spec.data.unshift({
      name: dataSourceName,
      url,
      format: { type: dataSource.format || "json" },
      transform: dataSource.dataFrameTransformations || []
    });
  }
  class VegaScope {
    constructor(spec) {
      __publicField(this, "spec");
      __publicField(this, "urlCount", 0);
      this.spec = spec;
    }
    createUrlSignal(url, tokens) {
      const name = `url:${this.urlCount++}:${safeVariableName(url)}`;
      const signal = { name };
      signal.update = renderVegaExpression(tokens);
      if (!this.spec.signals) {
        this.spec.signals = [];
      }
      this.spec.signals.push(signal);
      return signal;
    }
  }
  const defaultJsonIndent = 2;
  function tickWrap(plugin, content) {
    return `\`\`\`${plugin}
${content}
\`\`\``;
  }
  function jsonWrap(type, content) {
    return tickWrap("json " + type, content);
  }
  function chartWrap(spec) {
    const chartType = getChartType(spec);
    return jsonWrap(chartType, JSON.stringify(spec, null, defaultJsonIndent));
  }
  function mdContainerWrap(classname, id, content) {
    return `::: ${classname} {#${id}}
${content}
:::`;
  }
  function targetMarkdown(page) {
    const mdSections = [];
    const dataLoaders = page.dataLoaders || [];
    const variables = page.variables || [];
    if (page.style) {
      const { style } = page;
      if (style.css) {
        let css;
        if (typeof style.css === "string") {
          css = style.css;
        } else if (Array.isArray(style.css)) {
          css = style.css.join("\n");
        }
        mdSections.push(tickWrap("css", css));
      }
      if (style.googleFonts) {
        mdSections.push(jsonWrap("google-fonts", JSON.stringify(style.googleFonts, null, defaultJsonIndent)));
      }
    }
    const tableElements = page.groups.flatMap((group) => group.elements.filter((e) => typeof e !== "string" && e.type === "table"));
    const vegaScope = dataLoaderMarkdown(dataLoaders.filter((dl) => dl.type !== "spec"), variables, tableElements);
    for (const dataLoader of dataLoaders.filter((dl) => dl.type === "spec")) {
      mdSections.push(chartWrap(dataLoader.spec));
    }
    for (const group of page.groups) {
      mdSections.push(mdContainerWrap(defaultCommonOptions.groupClassName, group.groupId, groupMarkdown(group, variables, vegaScope, page.resources)));
    }
    const { data, signals } = vegaScope.spec;
    if ((data == null ? void 0 : data.length) === 0) {
      delete vegaScope.spec.data;
    } else {
      data.forEach((d) => {
        var _a;
        if (((_a = d.transform) == null ? void 0 : _a.length) === 0) {
          delete d.transform;
        }
      });
    }
    if ((signals == null ? void 0 : signals.length) === 0) {
      delete vegaScope.spec.signals;
    }
    if (vegaScope.spec.data || vegaScope.spec.signals) {
      mdSections.unshift(chartWrap(vegaScope.spec));
    }
    if (page.notes) {
      if (Array.isArray(page.notes)) {
        mdSections.unshift(tickWrap("#", page.notes.map((n) => {
          if (typeof n === "object") {
            return JSON.stringify(n, null, defaultJsonIndent);
          } else if (typeof n === "string") {
            return n;
          } else {
            return JSON.stringify(n);
          }
        }).join("\n")));
      } else {
        mdSections.unshift(tickWrap("#", JSON.stringify(page.notes, null, defaultJsonIndent)));
      }
    }
    const markdown = mdSections.join("\n\n");
    return markdown;
  }
  function dataLoaderMarkdown(dataSources, variables, tableElements) {
    const spec = createSpecWithVariables(variables, tableElements);
    const vegaScope = new VegaScope(spec);
    for (const dataSource of dataSources) {
      switch (dataSource.type) {
        case "inline": {
          addStaticDataLoaderToSpec(vegaScope, dataSource);
          break;
        }
        case "file": {
          addStaticDataLoaderToSpec(vegaScope, dataSource);
          break;
        }
        case "url": {
          addDynamicDataLoaderToSpec(vegaScope, dataSource);
          break;
        }
      }
    }
    return vegaScope;
  }
  function groupMarkdown(group, variables, vegaScope, resources) {
    var _a, _b, _c, _d, _e;
    const mdElements = [];
    const addSpec = (pluginName, spec, indent = true) => {
      const content = indent ? JSON.stringify(spec, null, defaultJsonIndent) : JSON.stringify(spec);
      mdElements.push(jsonWrap(pluginName, content));
    };
    for (const element of group.elements) {
      if (typeof element === "string") {
        mdElements.push(element);
      } else if (typeof element === "object") {
        switch (element.type) {
          case "chart": {
            const { chartKey } = element;
            const spec = (_a = resources == null ? void 0 : resources.charts) == null ? void 0 : _a[chartKey];
            if (!spec) {
              mdElements.push("![Chart Spinner](/img/chart-spinner.gif)");
            } else {
              mdElements.push(chartWrap(spec));
            }
            break;
          }
          case "checkbox": {
            const { label, variableId } = element;
            const cbSpec = {
              variableId,
              value: (_b = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _b.initialValue,
              label
            };
            addSpec("checkbox", cbSpec, false);
            break;
          }
          case "dropdown": {
            const { label, variableId, options, dynamicOptions, multiple, size } = element;
            const ddSpec = {
              variableId,
              value: (_c = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _c.initialValue,
              label
            };
            if (dynamicOptions) {
              const { dataSourceName, fieldName } = dynamicOptions;
              ddSpec.dynamicOptions = {
                dataSourceName,
                fieldName
              };
            } else {
              ddSpec.options = options;
            }
            if (multiple) {
              ddSpec.multiple = multiple;
              ddSpec.size = size || 1;
            }
            addSpec("dropdown", ddSpec);
            break;
          }
          case "image": {
            const { url, alt, width, height } = element;
            const imageSpec = {
              url,
              alt,
              width,
              height
            };
            addSpec("image", imageSpec);
            break;
          }
          case "presets": {
            const { presets } = element;
            const presetsSpec = presets;
            addSpec("presets", presetsSpec);
            break;
          }
          case "slider": {
            const { label, min, max, step, variableId } = element;
            const sliderSpec = {
              variableId,
              value: (_d = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _d.initialValue,
              label,
              min,
              max,
              step
            };
            addSpec("slider", sliderSpec, false);
            break;
          }
          case "table": {
            const { dataSourceName, variableId, tabulatorOptions, editable } = element;
            const tableSpec = { dataSourceName, variableId, tabulatorOptions, editable };
            addSpec("tabulator", tableSpec);
            break;
          }
          case "textbox": {
            const { variableId, label, multiline, placeholder } = element;
            const textboxSpec = {
              variableId,
              value: (_e = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _e.initialValue,
              label,
              multiline,
              placeholder
            };
            addSpec("textbox", textboxSpec, false);
            break;
          }
          default: {
            mdElements.push(tickWrap("#", JSON.stringify(element)));
          }
        }
      } else {
        mdElements.push(tickWrap("#", JSON.stringify(element)));
      }
    }
    const markdown = mdElements.join("\n\n");
    return markdown;
  }
  const index$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    targetMarkdown
  }, Symbol.toStringTag, { value: "Module" }));
  class Previewer {
    constructor(elementOrSelector, markdown, options) {
      __publicField(this, "options");
      __publicField(this, "element");
      this.options = options;
      if (typeof elementOrSelector === "string") {
        this.element = document.querySelector(elementOrSelector);
        if (!this.element) {
          throw new Error(`Element not found: ${elementOrSelector}`);
        }
      } else if (elementOrSelector instanceof HTMLElement) {
        this.element = elementOrSelector;
      } else {
        throw new Error("Invalid element type, must be a string selector or HTMLElement");
      }
    }
    send(markdown) {
      throw new Error("Method not implemented.");
    }
  }
  const rendererHtml = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    {{CSS_RESET}}
    
    <title>{{TITLE}}</title>

    {{DEPENDENCIES}}

    {{RENDERER_SCRIPT}}

    {{RENDER_OPTIONS}}

    {{RENDER_REQUEST}}

    {{SANDBOX_JS}}

</head>

<body></body>

</html>`;
  const sandboxedJs = `let renderer;
document.addEventListener('DOMContentLoaded', () => {
    let transactionIndex = 0;
    const transactions = {};
    renderer = new Chartifact.markdown.Renderer(document.body, {
        ...rendererOptions,
        errorHandler: (error, pluginName, instanceIndex, phase, container, detail) => {
            console.error(\`Error in plugin \${pluginName} at instance \${instanceIndex} during \${phase}:\`, error);
            if (detail) {
                console.error('Detail:', detail);
            }
            container.innerHTML = \`<div style="color: red;">Error: \${error.message}</div>\`;
        }
    });
    function render(request) {
        if (request.markdown) {
            renderer.reset();
            //debugger;
            const html = renderer.renderHtml(request.markdown);
            renderer.element.innerHTML = html;
            const specs = renderer.hydrateSpecs();
            const transactionId = transactionIndex++;
            transactions[transactionId] = specs;
            //send message to parent to ask for whitelist
            const sandboxedPreRenderMessage = {
                type: 'sandboxedPreHydrate',
                transactionId,
                specs,
            };
            window.parent.postMessage(sandboxedPreRenderMessage, '*');
        }
    }
    render(renderRequest);
    //add listener for postMessage
    window.addEventListener('message', (event) => {
        if (!event.data)
            return;
        const message = event.data;
        switch (message.type) {
            case 'sandboxRender': {
                render(message);
                break;
            }
            case 'sandboxApproval': {
                //debugger;
                //only handle if the transactionId is the latest
                if (message.transactionId === transactionIndex - 1) {
                    //todo: console.warn of unapproved
                    //hydrate the renderer
                    const flags = transactions[message.transactionId];
                    if (flags) {
                        renderer.hydrate(flags);
                    }
                }
                else {
                    console.debug('Received sandbox approval for an outdated transaction:', message.transactionId, transactionIndex);
                }
                break;
            }
        }
    });
});
`;
  class Sandbox extends Previewer {
    constructor(elementOrSelector, markdown, options) {
      super(elementOrSelector, markdown, options);
      __publicField(this, "options");
      __publicField(this, "iframe");
      this.options = options;
      const renderRequest = {
        type: "sandboxRender",
        markdown
      };
      const { iframe } = this.createIframe(renderRequest);
      this.iframe = iframe;
      this.element.appendChild(this.iframe);
      this.iframe.addEventListener("load", () => {
        var _a;
        (_a = options == null ? void 0 : options.onReady) == null ? void 0 : _a.call(options);
      });
      this.iframe.addEventListener("error", (error) => {
        var _a;
        console.error("Error loading iframe:", error);
        (_a = options == null ? void 0 : options.onError) == null ? void 0 : _a.call(options, new Error("Failed to load iframe"));
      });
      window.addEventListener("message", (event) => {
        var _a;
        if (event.source === this.iframe.contentWindow) {
          const message = event.data;
          if (message.type == "sandboxedPreHydrate") {
            const specs = this.options.onApprove(message);
            const sandboxedApprovalMessage = {
              type: "sandboxApproval",
              transactionId: message.transactionId,
              specs
            };
            (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(sandboxedApprovalMessage, "*");
          }
        }
      });
    }
    createIframe(renderRequest, rendererOptions = {}) {
      const title = "Chartifact Interactive Document Sandbox";
      const html = rendererHtml.replace("{{TITLE}}", () => title).replace("{{CSS_RESET}}", () => this.getCssReset()).replace("{{DEPENDENCIES}}", () => this.getDependencies()).replace("{{RENDERER_SCRIPT}}", () => this.getRendererScript()).replace("{{RENDER_REQUEST}}", () => `<script>const renderRequest = ${JSON.stringify(renderRequest)};<\/script>`).replace("{{RENDER_OPTIONS}}", () => `<script>const rendererOptions = ${JSON.stringify(rendererOptions)};<\/script>`).replace("{{SANDBOX_JS}}", () => `<script>${sandboxedJs}<\/script>`);
      const htmlBlob = new Blob([html], { type: "text/html" });
      const blobUrl = URL.createObjectURL(htmlBlob);
      const iframe = document.createElement("iframe");
      iframe.sandbox = "allow-scripts allow-popups";
      iframe.src = blobUrl;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.title = title;
      return { iframe, blobUrl };
    }
    destroy() {
      var _a;
      this.iframe.removeEventListener("load", () => {
      });
      this.iframe.removeEventListener("error", () => {
      });
      (_a = this.iframe) == null ? void 0 : _a.remove();
    }
    send(markdown) {
      var _a;
      const message = {
        type: "sandboxRender",
        markdown
      };
      (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(message, "*");
    }
    getDependencies() {
      return `
<link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"><\/script>
<script src="https://unpkg.com/css-tree/dist/csstree.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/vega@5.29.0"><\/script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1"><\/script>
<script src="https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js"><\/script>
`;
    }
    getCssReset() {
      return '<link href="https://microsoft.github.io/chartifact/dist/v1/chartifact-reset.css" rel="stylesheet" />';
    }
    getRendererScript() {
      return `<script src="https://microsoft.github.io/chartifact/dist/v1/chartifact.markdown.umd.js"><\/script>`;
    }
  }
  const index$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Previewer,
    Sandbox
  }, Symbol.toStringTag, { value: "Module" }));
  class SandboxDocumentPreview extends React$1.Component {
    constructor(props) {
      super(props);
      __publicField(this, "containerRef");
      __publicField(this, "sandboxRef");
      __publicField(this, "isSandboxReady");
      __publicField(this, "pendingUpdate");
      this.containerRef = React$1.createRef();
      this.sandboxRef = null;
      this.isSandboxReady = false;
      this.pendingUpdate = null;
    }
    componentDidMount() {
      if (this.containerRef.current && !this.sandboxRef) {
        try {
          const markdown = targetMarkdown(this.props.page);
          this.sandboxRef = new (this.props.previewer || Sandbox)(
            this.containerRef.current,
            markdown,
            {
              onReady: () => {
                this.isSandboxReady = true;
                if (this.pendingUpdate) {
                  this.processUpdate(this.pendingUpdate);
                  this.pendingUpdate = null;
                }
              },
              onError: (error) => console.error("Sandbox initialization failed:", error),
              onApprove: this.props.onApprove
            }
          );
        } catch (error) {
          console.error("Failed to initialize sandbox:", error);
        }
      }
    }
    componentDidUpdate(prevProps) {
      if (this.props.page !== prevProps.page) {
        if (this.isSandboxReady) {
          this.processUpdate(this.props.page);
        } else {
          this.pendingUpdate = this.props.page;
        }
      }
    }
    processUpdate(page) {
      if (this.sandboxRef) {
        try {
          const markdown = targetMarkdown(page);
          this.sandboxRef.send(markdown);
        } catch (error) {
          if (this.containerRef.current) {
            this.containerRef.current.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background-color: #ffe6e6; border-radius: 4px;">
                        <strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}
                    </div>`;
          }
        }
      }
    }
    componentWillUnmount() {
      if (this.sandboxRef) {
        this.sandboxRef = null;
      }
    }
    render() {
      return /* @__PURE__ */ React$1.createElement(
        "div",
        {
          style: { display: "grid" },
          ref: this.containerRef
        }
      );
    }
  }
  function Editor(props) {
    const postMessageTarget = props.postMessageTarget || window.parent;
    const [page, setPage] = React.useState(() => ({
      title: "Initializing...",
      layout: {
        css: ""
      },
      dataLoaders: [],
      groups: [
        {
          groupId: "init",
          elements: [
            "# 🔄 Editor Initializing",
            "Please wait while the editor loads...",
            "",
            "The editor is ready and waiting for content from the host application.",
            "",
            "📡 **Status**: Ready to receive documents"
          ]
        }
      ],
      variables: []
    }));
    React.useEffect(() => {
      const handleMessage = (event) => {
        if (event.data && event.data.sender !== "editor") {
          if (event.data.type === "editorPage" && event.data.page) {
            setPage(event.data.page);
          }
        }
      };
      window.addEventListener("message", handleMessage);
      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }, []);
    React.useEffect(() => {
      const readyMessage = {
        type: "editorReady",
        sender: "editor"
      };
      postMessageTarget.postMessage(readyMessage, "*");
    }, []);
    return /* @__PURE__ */ React.createElement(
      EditorView,
      {
        page,
        postMessageTarget,
        previewer: props.previewer,
        onApprove: props.onApprove
      }
    );
  }
  function EditorView(props) {
    const { page, postMessageTarget, previewer, onApprove } = props;
    const sendEditToApp = (newPage) => {
      const pageMessage = {
        type: "editorPage",
        page: newPage,
        sender: "editor"
      };
      postMessageTarget.postMessage(pageMessage, "*");
    };
    const deleteElement = (groupIndex, elementIndex) => {
      const newPage = {
        ...page,
        groups: page.groups.map((group, gIdx) => {
          if (gIdx === groupIndex) {
            return {
              ...group,
              elements: group.elements.filter((_, eIdx) => eIdx !== elementIndex)
            };
          }
          return group;
        })
      };
      sendEditToApp(newPage);
    };
    const deleteGroup = (groupIndex) => {
      const newPage = {
        ...page,
        groups: page.groups.filter((_, gIdx) => gIdx !== groupIndex)
      };
      sendEditToApp(newPage);
    };
    return /* @__PURE__ */ React.createElement("div", { style: {
      display: "grid",
      gridTemplateColumns: "320px 1fr",
      height: "100vh",
      overflow: "hidden"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      padding: "10px",
      borderRight: "1px solid #ccc",
      overflowY: "auto"
    } }, /* @__PURE__ */ React.createElement("h3", null, "Tree View"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", null, "📄 ", page.title), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "20px" } }, page.groups.map((group, groupIndex) => /* @__PURE__ */ React.createElement("div", { key: groupIndex, style: { marginBottom: "10px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "5px" } }, "📁 ", group.groupId, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => deleteGroup(groupIndex),
        style: {
          background: "#ff4444",
          color: "white",
          border: "none",
          borderRadius: "3px",
          padding: "2px 6px",
          fontSize: "10px",
          cursor: "pointer"
        },
        title: "Delete group"
      },
      "✕"
    )), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "20px" } }, group.elements.map((element, elementIndex) => /* @__PURE__ */ React.createElement("div", { key: elementIndex, style: { display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" } }, /* @__PURE__ */ React.createElement("span", null, typeof element === "string" ? `📝 ${element.slice(0, 30)}${element.length > 30 ? "..." : ""}` : `🎨 ${element.type}`), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => deleteElement(groupIndex, elementIndex),
        style: {
          background: "#ff4444",
          color: "white",
          border: "none",
          borderRadius: "3px",
          padding: "2px 6px",
          fontSize: "10px",
          cursor: "pointer"
        },
        title: "Delete element"
      },
      "✕"
    ))))))))), /* @__PURE__ */ React.createElement("div", { style: {
      display: "grid",
      gridTemplateRows: "auto 1fr",
      padding: "10px",
      overflowY: "auto"
    } }, /* @__PURE__ */ React.createElement("h3", null, "Document Preview"), /* @__PURE__ */ React.createElement(
      SandboxDocumentPreview,
      {
        page,
        previewer,
        onApprove
      }
    )));
  }
  function App(props) {
    const { previewer } = props;
    const [history, setHistory] = React.useState([initialPage]);
    const [historyIndex, setHistoryIndex] = React.useState(0);
    const [currentPage, setCurrentPage] = React.useState(initialPage);
    const editorContainerRef = React.useRef(null);
    const [isEditorReady, setIsEditorReady] = React.useState(false);
    const undo = () => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const page = history[newIndex];
        setCurrentPage(page);
        sendPageToEditor(page);
      }
    };
    const redo = () => {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        const page = history[newIndex];
        setCurrentPage(page);
        sendPageToEditor(page);
      }
    };
    const sendPageToEditor = (page, skipReadyCheck = false) => {
      if (!skipReadyCheck && !isEditorReady) {
        return;
      }
      const pageMessage = {
        type: "editorPage",
        page,
        sender: "app"
      };
      window.postMessage(pageMessage, "*");
    };
    React.useEffect(() => {
      const handleMessage = (event) => {
        if (event.data && event.data.sender === "editor") {
          if (event.data.type === "editorReady") {
            setIsEditorReady(true);
            sendPageToEditor(currentPage);
          } else if (event.data.type === "editorPage" && event.data.page) {
            const pageMessage = event.data;
            setHistoryIndex((prevIndex) => {
              setHistory((prevHistory) => {
                const newHistory = prevHistory.slice(0, prevIndex + 1);
                newHistory.push(pageMessage.page);
                return newHistory;
              });
              setCurrentPage(pageMessage.page);
              sendPageToEditor(pageMessage.page, true);
              return prevIndex + 1;
            });
          }
        }
      };
      window.addEventListener("message", handleMessage);
      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }, []);
    React.useEffect(() => {
      if (isEditorReady) {
        sendPageToEditor(currentPage);
      }
    }, [isEditorReady]);
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100vh" } }, /* @__PURE__ */ React.createElement("div", { style: {
      padding: "10px",
      backgroundColor: "#f5f5f5",
      borderBottom: "1px solid #ccc",
      display: "flex",
      gap: "10px",
      alignItems: "center"
    } }, /* @__PURE__ */ React.createElement("h2", { style: { margin: 0 } }, "Document Editor"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "5px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: undo,
        disabled: historyIndex <= 0,
        style: {
          padding: "5px 10px",
          backgroundColor: historyIndex <= 0 ? "#ccc" : "#007acc",
          color: "white",
          border: "none",
          borderRadius: "3px",
          cursor: historyIndex <= 0 ? "not-allowed" : "pointer"
        }
      },
      "↶ Undo"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: redo,
        disabled: historyIndex >= history.length - 1,
        style: {
          padding: "5px 10px",
          backgroundColor: historyIndex >= history.length - 1 ? "#ccc" : "#007acc",
          color: "white",
          border: "none",
          borderRadius: "3px",
          cursor: historyIndex >= history.length - 1 ? "not-allowed" : "pointer"
        }
      },
      "↷ Redo"
    ), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "10px", fontSize: "12px", color: "#666" } }, "History: ", historyIndex + 1, " / ", history.length))), /* @__PURE__ */ React.createElement("div", { ref: editorContainerRef, style: { flex: 1 } }, /* @__PURE__ */ React.createElement(
      Editor,
      {
        previewer,
        onApprove: props.onApprove
      }
    )));
  }
  const initialPage = {
    "title": "Seattle Weather",
    "dataLoaders": [
      {
        "type": "url",
        "url": "https://vega.github.io/editor/data/seattle-weather.csv",
        "dataSourceName": "seattle_weather",
        "format": "csv",
        "dataFrameTransformations": []
      }
    ],
    "groups": [
      {
        "groupId": "main",
        "elements": [
          "# Seattle Weather\n\nData table:",
          {
            "type": "table",
            "dataSourceName": "seattle_weather",
            "variableId": "seattle_weather_selected"
          },
          "Here is a stacked bar chart of Seattle weather:\nEach bar represents the count of weather types for each month.\nThe colors distinguish between different weather conditions such as sun, fog, drizzle, rain, and snow.",
          {
            "type": "chart",
            "chartKey": "1"
          },
          "This section introduces a heatmap visualization for the Seattle weather dataset.\nThe heatmap is designed to display the distribution and intensity of weather-related variables,\nsuch as temperature, precipitation, or frequency of weather events, across different time periods or categories.\nIt provides an intuitive way to identify patterns, trends, and anomalies in the dataset.",
          {
            "type": "chart",
            "chartKey": "2"
          }
        ]
      }
    ],
    "resources": {
      "charts": {
        "1": {
          "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
          "data": {
            "name": "seattle_weather"
          },
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
                "domain": [
                  "sun",
                  "fog",
                  "drizzle",
                  "rain",
                  "snow"
                ],
                "range": [
                  "#e7ba52",
                  "#c7c7c7",
                  "#aec7e8",
                  "#1f77b4",
                  "#9467bd"
                ]
              },
              "title": "Weather type"
            }
          }
        },
        "2": {
          "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
          "data": {
            "name": "seattle_weather"
          },
          "title": "Daily Max Temperatures (C) in Seattle, WA",
          "config": {
            "view": {
              "strokeWidth": 0,
              "step": 13
            },
            "axis": {
              "domain": false
            }
          },
          "mark": "rect",
          "encoding": {
            "x": {
              "field": "date",
              "timeUnit": "date",
              "type": "ordinal",
              "title": "Day",
              "axis": {
                "labelAngle": 0,
                "format": "%e"
              }
            },
            "y": {
              "field": "date",
              "timeUnit": "month",
              "type": "ordinal",
              "title": "Month"
            },
            "color": {
              "field": "temp_max",
              "aggregate": "max",
              "type": "quantitative",
              "legend": {
                "title": null
              }
            }
          }
        }
      }
    }
  };
  const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    App,
    Editor
  }, Symbol.toStringTag, { value: "Module" }));
  exports2.common = index$3;
  exports2.compiler = index$2;
  exports2.editor = index;
  exports2.sandbox = index$1;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
