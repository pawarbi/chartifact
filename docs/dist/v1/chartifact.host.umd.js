(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("vega")) : typeof define === "function" && define.amd ? define(["exports", "vega"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.Chartifact = global.Chartifact || {}, global.vega));
})(this, (function(exports2, vega) {
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
  const index$4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
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
  const defaultOptions$1 = {
    extraNewlineCount: 1
  };
  function targetMarkdown(page, options) {
    const finalOptions = { ...defaultOptions$1, ...options };
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
    const newLines = "\n".repeat(1 + finalOptions.extraNewlineCount);
    const markdown = mdSections.join(newLines);
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
          case "mermaid": {
            const { diagramText, template, variableId } = element;
            if (diagramText) {
              mdElements.push(tickWrap("mermaid", diagramText));
            } else if (template) {
              const mermaidSpec = {
                template
              };
              if (variableId) {
                mermaidSpec.variableId = variableId;
              }
              addSpec("mermaid", mermaidSpec);
            } else if (variableId) {
              const mermaidSpec = {
                variableId
              };
              addSpec("mermaid", mermaidSpec, false);
            }
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
  const index$3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    targetMarkdown
  }, Symbol.toStringTag, { value: "Module" }));
  const rendererHtml = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>{{TITLE}}</title>

    {{DEPENDENCIES}}

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
  class Sandbox {
    constructor(elementOrSelector, markdown, options) {
      __publicField(this, "options");
      __publicField(this, "element");
      __publicField(this, "iframe");
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
      const html = rendererHtml.replace("{{TITLE}}", () => title).replace("{{DEPENDENCIES}}", () => this.getDependencies()).replace("{{RENDER_REQUEST}}", () => `<script>const renderRequest = ${JSON.stringify(renderRequest)};<\/script>`).replace("{{RENDER_OPTIONS}}", () => `<script>const rendererOptions = ${JSON.stringify(rendererOptions)};<\/script>`).replace("{{SANDBOX_JS}}", () => `<script>${sandboxedJs}<\/script>`);
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
<link href="https://microsoft.github.io/chartifact/dist/v1/chartifact-reset.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"><\/script>
<script src="https://unpkg.com/css-tree/dist/csstree.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/vega@5.29.0"><\/script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1"><\/script>
<script src="https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js"><\/script>
<script src="https://microsoft.github.io/chartifact/dist/v1/chartifact.markdown.umd.js"><\/script>
`;
    }
  }
  const index$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Sandbox
  }, Symbol.toStringTag, { value: "Module" }));
  const guardedJs = `/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
function sniffContent(content) {
    if (typeof content !== 'string') {
        console.warn('Blocked: content is not a string. Type:', typeof content);
        return false;
    }
    const len = content.length;
    if (len < 5) {
        console.warn('Blocked: content too short (length =', len + ')');
        return false;
    }
    if (len > 1_000_000) {
        console.warn('Blocked: content too large (length =', len + ')');
        return false;
    }
    const head = content.slice(0, 512);
    const lower = head.toLowerCase();
    for (let i = 0; i < head.length; i++) {
        const code = head.charCodeAt(i);
        if ((code < 32 && code !== 9 && code !== 10 && code !== 13) ||
            code > 126) {
            console.warn('Blocked: binary or control char at pos', i, '(charCode =', code + ')');
            return false;
        }
    }
    const badSignatures = [
        '<html', '<script', '<style', '<iframe', '<svg', '<link',
        '<meta', '<!doctype', '<?xml', '</',
        '%pdf', '{\\\\rtf', 'mz', 'gif89a', 'gif87a', '\\x7felf', 'pk\\x03\\x04'
    ];
    const sig = lower.slice(0, 64);
    for (const s of badSignatures) {
        if (sig.includes(s)) {
            console.warn('Blocked: matched dangerous signature:', s);
            return false;
        }
    }
    return true;
}
window.addEventListener('message', async (e) => {
    const { url, options } = (e.data || {});
    let responseMessage;
    try {
        const res = await fetch(url, options);
        const body = await res.text();
        if (!sniffContent(body)) {
            console.warn('Content blocked:', url);
            responseMessage = { status: 403, error: 'Blocked by content firewall' };
        }
        else {
            responseMessage = { status: res.status, body };
        }
    }
    catch (err) {
        console.error('Fetch error:', url, err);
        responseMessage = { status: 500, error: err.message || 'Fetch failed' };
    }
    e.source?.postMessage(responseMessage, '*');
});
`;
  function guardedFetch(request) {
    return new Promise((resolve, reject) => {
      const loaderHTML = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="
    base-uri 'none';
">
</head>
<body>
<script>
${guardedJs}
<\/script>
</body>
</html>
`;
      const blob = new Blob([loaderHTML], { type: "text/html" });
      const blobURL = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.sandbox = "allow-scripts";
      iframe.referrerPolicy = "no-referrer";
      iframe.style.display = "none";
      iframe.src = blobURL;
      const cleanup = () => {
        window.removeEventListener("message", onMessage);
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobURL);
      };
      const onMessage = (event) => {
        if (event.source !== iframe.contentWindow) return;
        const { status, body, error } = event.data || {};
        cleanup();
        if (error) return reject(new Error(error));
        if (typeof status !== "number" || typeof body !== "string") {
          return reject(new Error("Invalid response from loader"));
        }
        resolve({ status, body });
      };
      window.addEventListener("message", onMessage);
      document.body.appendChild(iframe);
      iframe.onload = () => {
        var _a;
        (_a = iframe.contentWindow) == null ? void 0 : _a.postMessage(request, "*");
      };
    });
  }
  function checkUrlForFile(host) {
    const urlParams = new URLSearchParams(window.location.search);
    const loadUrl = urlParams.get(host.options.urlParamName);
    if (!loadUrl) {
      return false;
    }
    loadViaUrl(loadUrl, host, true, false);
    return true;
  }
  async function loadViaUrl(loadUrl, host, handle, showRestart) {
    if (!isSameOrigin(loadUrl) && !isValidLoadUrl(loadUrl)) {
      return {
        error: "Invalid URL format",
        errorDetail: "The URL provided is not same-origin or has an invalid format, protocol, or contains suspicious characters."
      };
    }
    try {
      const url = new URL(loadUrl, window.location.href);
      const response = await guardedFetch({ url: url.href });
      if (!response.status) {
        return {
          error: "Error loading file",
          errorDetail: `Error loading file from the provided URL`
        };
      }
      return determineContent(url.href, response.body, host, handle, showRestart);
    } catch (error) {
      return {
        error: "Error loading file",
        errorDetail: `Error loading file from the provided URL`
      };
    }
  }
  function isSameOrigin(url) {
    try {
      if (!url.includes("://")) {
        return true;
      }
      const parsedUrl = new URL(url);
      return parsedUrl.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  function isValidLoadUrl(url) {
    try {
      const parsedUrl = new URL(url, window.location.href);
      if (parsedUrl.protocol !== "https:" && !(parsedUrl.protocol === "http:" && (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1"))) {
        return false;
      }
      if (["javascript:", "vbscript:", "data:"].includes(parsedUrl.protocol)) {
        return false;
      }
      const hostname = parsedUrl.hostname.toLowerCase();
      if (hostname.includes("<") || hostname.includes(">") || hostname.includes('"') || hostname.includes("'")) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
  function loadFolder(folderUrl, folder, host) {
    if (!folder || !folder.docs) {
      host.errorHandler(
        "Invalid folder format",
        "Please provide a valid folder JSON."
      );
      return;
    }
    if (folder.docs.length === 0) {
      host.errorHandler(
        "Empty folder",
        "The folder does not contain any documents."
      );
      return;
    }
    if (!host.toolbar) {
      host.errorHandler(
        "Toolbar not found",
        "The toolbar element is required to load folder content."
      );
      return;
    }
    let docIndex = 0;
    const { folderSpan } = host.toolbar;
    folderSpan.style.display = "";
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.disabled = docIndex === 0;
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.disabled = docIndex === folder.docs.length - 1;
    const pageSelect = document.createElement("select");
    for (let i = 0; i < folder.docs.length; i++) {
      const option = document.createElement("option");
      option.value = (i + 1).toString();
      option.textContent = folder.docs[i].title ? folder.docs[i].title : `Page ${i + 1}`;
      pageSelect.appendChild(option);
    }
    pageSelect.value = (docIndex + 1).toString();
    const navDiv = document.createElement("div");
    navDiv.style.display = "inline-block";
    navDiv.appendChild(prevBtn);
    navDiv.appendChild(pageSelect);
    navDiv.appendChild(nextBtn);
    function getHashParam(key) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      return params.get(key) ?? void 0;
    }
    function setHashParam(key, value) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      params.set(key, value.toString());
      window.location.hash = params.toString();
    }
    function updateFolderTitle() {
      folderSpan.innerHTML = "";
      const label = document.createElement("span");
      label.textContent = `${folder.title} `;
      const docCountDiv = document.createElement("div");
      docCountDiv.style.display = "inline-block";
      docCountDiv.style.marginRight = "0.5em";
      docCountDiv.textContent = `(document ${docIndex + 1} of ${folder.docs.length}) `;
      folderSpan.appendChild(label);
      folderSpan.appendChild(docCountDiv);
      folderSpan.appendChild(navDiv);
    }
    updateFolderTitle();
    function updatePage(newDocIndex, setHash = false) {
      docIndex = newDocIndex;
      if (setHash) {
        setHashParam("page", docIndex + 1);
      }
      prevBtn.disabled = docIndex === 0;
      nextBtn.disabled = docIndex === folder.docs.length - 1;
      pageSelect.value = (docIndex + 1).toString();
      updateFolderTitle();
      const title = folder.docs[docIndex].title || `Page ${docIndex + 1}`;
      resolveUrl(title, folderUrl, folder.docs[docIndex].href, host);
    }
    pageSelect.onchange = () => {
      const selectedPage = parseInt(pageSelect.value, 10);
      if (selectedPage >= 1 && selectedPage <= folder.docs.length) {
        updatePage(selectedPage - 1, true);
      }
    };
    prevBtn.onclick = () => {
      if (docIndex > 0) {
        updatePage(docIndex - 1, true);
      }
    };
    nextBtn.onclick = () => {
      if (docIndex < folder.docs.length - 1) {
        updatePage(docIndex + 1, true);
      }
    };
    function goToPageFromHash() {
      const pageStr = getHashParam("page");
      let newIndex = 0;
      if (pageStr) {
        const page = parseInt(pageStr, 10);
        if (page >= 1 && page <= folder.docs.length) {
          newIndex = page - 1;
        }
      }
      updatePage(newIndex, false);
    }
    window.addEventListener("hashchange", goToPageFromHash);
    if (!getHashParam("page")) {
      setHashParam("page", docIndex + 1);
    }
    goToPageFromHash();
    folderSpan.appendChild(navDiv);
  }
  async function resolveUrl(title, base, relativeOrAbsolute, host) {
    let url;
    try {
      url = base ? new URL(relativeOrAbsolute, base).href : relativeOrAbsolute;
    } catch (error) {
      host.errorHandler(
        "Invalid URL",
        `Invalid URL: ${relativeOrAbsolute} relative to ${base}`
      );
      return;
    }
    const result = await loadViaUrl(url, host, false, false);
    if (result.error) {
      host.errorHandler(
        result.error,
        result.errorDetail
      );
      return;
    }
    if (result.idoc) {
      host.render(title, void 0, result.idoc, false);
    } else if (result.markdown) {
      host.render(title, result.markdown, void 0, false);
    } else if (result.folder) {
      host.render("Error", "Nested folders are not supported", void 0, false);
    } else {
      host.errorHandler(
        "Invalid document format",
        "The document could not be loaded from the folder."
      );
    }
  }
  function determineContent(urlOrTitle, content, host, handle, showRestart) {
    const result = _determineContent(content);
    if (handle) {
      if (result.error) {
        host.errorHandler(
          result.error,
          result.errorDetail
        );
        return;
      } else if (result.idoc) {
        host.render(urlOrTitle, void 0, result.idoc, showRestart);
      } else if (result.folder) {
        loadFolder(urlOrTitle, result.folder, host);
      } else if (result.markdown) {
        host.render(urlOrTitle, result.markdown, void 0, showRestart);
      }
    }
    return result;
  }
  function _determineContent(content) {
    if (!content) {
      return {
        error: "Content is empty",
        errorDetail: "The content was empty. Please use valid markdown content or JSON."
      };
    }
    if (typeof content !== "string") {
      return {
        error: "Invalid content type",
        errorDetail: "The content is not a string. Please use valid markdown content or JSON."
      };
    }
    content = content.trim();
    if (!content) {
      return {
        error: "Content is empty",
        errorDetail: "The content was only whitespace. Please use valid markdown content or JSON."
      };
    }
    if (content.startsWith("{") && content.endsWith("}")) {
      try {
        const idoc_or_folder = JSON.parse(content);
        if (typeof idoc_or_folder !== "object") {
          return {
            error: "Invalid JSON format",
            errorDetail: "Please provide a valid Interactive Document or Folder JSON."
          };
        } else if (idoc_or_folder.$schema.endsWith("idoc_v1.json")) {
          const idoc = idoc_or_folder;
          return {
            idoc
          };
        } else if (idoc_or_folder.$schema.endsWith("folder_v1.json")) {
          const folder = idoc_or_folder;
          return {
            folder
          };
        } else {
          return {
            error: "Unsupported schema",
            errorDetail: "The provided JSON does not match any known schema."
          };
        }
      } catch (jsonError) {
        return {
          error: "Invalid JSON content in clipboard",
          errorDetail: "The pasted content is not valid JSON. Please copy a valid interactive document JSON file."
        };
      }
    } else {
      return {
        markdown: content
      };
    }
  }
  function readFile(file, host) {
    if (file.name.endsWith(".json") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        var _a;
        let content = (_a = e.target) == null ? void 0 : _a.result;
        if (!content) {
          host.errorHandler(
            "File content is empty",
            "The file is empty. Please use a valid markdown or JSON file."
          );
          return;
        }
        content = content.trim();
        if (!content) {
          host.errorHandler(
            "File content is empty",
            "The file is empty or contains only whitespace. Please use a valid markdown or JSON file."
          );
          return;
        }
        determineContent(file.name, content, host, true, true);
      };
      reader.onerror = (e) => {
        host.errorHandler(
          "Failed to read file",
          "Error reading file"
        );
      };
      reader.readAsText(file);
    } else {
      host.errorHandler(
        "Invalid file type",
        "Only markdown (.md) or JSON (.json) files are supported."
      );
    }
  }
  function setupClipboardHandling(host) {
    const pasteHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const clipboardData = e.clipboardData;
      if (clipboardData && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        readFile(file, host);
      } else if (clipboardData && clipboardData.items) {
        let handled = false;
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.kind === "string" && item.type === "text/plain") {
            item.getAsString((content) => {
              if (!content) {
                host.errorHandler(
                  "Pasted content is empty",
                  "The pasted content was empty. Please paste valid markdown content or JSON."
                );
                return;
              }
              content = content.trim();
              if (!content) {
                host.errorHandler(
                  "Pasted content is empty",
                  "The pasted content was only whitespace. Please paste valid markdown content or JSON."
                );
                return;
              }
              determineContent("clipboard-content", content, host, true, true);
            });
            handled = true;
            break;
          }
        }
        if (!handled) {
          host.errorHandler(
            "Unsupported clipboard content",
            "Please paste a markdown file, JSON file, or valid text content."
          );
        }
      } else {
        host.errorHandler(
          "Unsupported clipboard content",
          "Please paste a markdown file, JSON file, or valid text content."
        );
      }
    };
    document.addEventListener("paste", pasteHandler);
    return () => {
      document.removeEventListener("paste", pasteHandler);
    };
  }
  function setupDragDropHandling(host) {
    const dragHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const dropHandler = (e) => {
      var _a, _b;
      e.preventDefault();
      e.stopPropagation();
      const files = (_a = e.dataTransfer) == null ? void 0 : _a.files;
      if (files && files.length > 0) {
        const file = files[0];
        readFile(file, host);
      } else if ((_b = e.dataTransfer) == null ? void 0 : _b.types.includes("text/plain")) {
        let content = e.dataTransfer.getData("text/plain");
        if (!content) {
          host.errorHandler(
            "Dropped content is empty",
            "The dropped content was empty. Please drop valid markdown content or JSON."
          );
          return;
        }
        content = content.trim();
        if (!content) {
          host.errorHandler(
            "Dropped content is empty",
            "The dropped content was only whitespace. Please drop valid markdown content or JSON."
          );
          return;
        }
        determineContent("dropped-content", content, host, true, true);
      } else {
        host.errorHandler(
          "Unsupported drop content",
          "Please drop a markdown file, JSON file, or valid text content."
        );
      }
    };
    document.addEventListener("drop", dropHandler);
    document.addEventListener("dragover", dragHandler);
    return () => {
      document.removeEventListener("drop", dropHandler);
      document.removeEventListener("dragover", dragHandler);
    };
  }
  function setupFileUpload(host) {
    const { uploadButton, fileInput } = host;
    if (!uploadButton || !fileInput) {
      host.errorHandler(
        "Upload button or file input not found",
        "Please ensure the upload button and file input elements are present in the HTML."
      );
      return;
    }
    uploadButton == null ? void 0 : uploadButton.addEventListener("click", () => {
      fileInput == null ? void 0 : fileInput.click();
    });
    fileInput == null ? void 0 : fileInput.addEventListener("change", (event) => {
      var _a;
      const file = (_a = event.target.files) == null ? void 0 : _a[0];
      if (file) {
        readFile(file, host);
      } else {
        host.errorHandler(
          "No file selected",
          "Please select a markdown or JSON file to upload."
        );
      }
    });
  }
  function setupPostMessageHandling(host) {
    window.addEventListener("message", (event) => {
      try {
        if (!event.data || typeof event.data !== "object") {
          host.errorHandler(
            "Invalid message format",
            "Received message is not an object or is undefined."
          );
          return;
        }
        const message = event.data;
        if (message.type == "hostRenderRequest") {
          if (message.markdown) {
            host.render(message.title, message.markdown, void 0, false);
          } else if (message.interactiveDocument) {
            host.render(message.title, void 0, message.interactiveDocument, false);
          } else {
          }
        }
      } catch (error) {
        host.errorHandler(
          error,
          "Error processing postMessage event"
        );
      }
    });
  }
  function postStatus(target, message) {
    if (target) {
      target.postMessage(message, "*");
    }
  }
  function getElement(elementOrSelector) {
    if (typeof elementOrSelector === "string") {
      return document.querySelector(elementOrSelector);
    }
    return elementOrSelector;
  }
  function show(element, shown) {
    if (!element) {
      return;
    }
    element.style.display = shown ? "" : "none";
  }
  const defaultOptions = {
    clipboard: true,
    dragDrop: true,
    fileUpload: true,
    postMessage: true,
    postMessageTarget: window.opener || window.parent || window,
    url: true,
    urlParamName: "load"
  };
  class Listener {
    constructor(options) {
      __publicField(this, "options");
      __publicField(this, "previewDiv");
      __publicField(this, "loadingDiv");
      __publicField(this, "helpDiv");
      __publicField(this, "uploadButton");
      __publicField(this, "fileInput");
      __publicField(this, "toolbar");
      __publicField(this, "sandbox");
      __publicField(this, "sandboxReady", false);
      __publicField(this, "onApprove");
      __publicField(this, "onSetMode");
      __publicField(this, "removeInteractionHandlers");
      __publicField(this, "sandboxConstructor");
      this.sandboxConstructor = options.sandboxConstructor || Sandbox;
      this.options = { ...defaultOptions, ...options == null ? void 0 : options.options };
      this.onApprove = options.onApprove;
      this.onSetMode = options.onSetMode || (() => {
      });
      this.removeInteractionHandlers = [];
      this.previewDiv = getElement(options.preview);
      this.loadingDiv = getElement(options.loading);
      this.helpDiv = getElement(options.help);
      this.uploadButton = getElement(options.uploadButton);
      this.fileInput = getElement(options.fileInput);
      if (options.toolbar) {
        this.toolbar = options.toolbar;
      }
      if (!this.previewDiv) {
        throw new Error("App container not found");
      }
      show(this.loadingDiv, true);
      show(this.helpDiv, false);
      this.createSandbox("");
      if (this.options.clipboard) {
        this.removeInteractionHandlers.push(setupClipboardHandling(this));
      }
      if (this.options.dragDrop) {
        this.removeInteractionHandlers.push(setupDragDropHandling(this));
      }
      if (this.options.fileUpload) {
        setupFileUpload(this);
      }
      if (this.options.postMessage) {
        setupPostMessageHandling(this);
      }
      if (!this.options.url || this.options.url && !checkUrlForFile(this)) {
        show(this.loadingDiv, false);
        show(this.helpDiv, true);
      }
    }
    createSandbox(markdown) {
      if (this.sandbox) {
        this.sandbox.destroy();
      }
      this.sandboxReady = false;
      this.sandbox = new this.sandboxConstructor(this.previewDiv, markdown, {
        onReady: () => {
          this.sandboxReady = true;
          postStatus(this.options.postMessageTarget, { type: "hostStatus", hostStatus: "ready" });
        },
        onError: () => {
          this.errorHandler(
            "Sandbox initialization failed",
            "Sandbox could not be initialized"
          );
        },
        onApprove: this.onApprove
      });
      if (!markdown) {
        show(this.sandbox.element, false);
      }
    }
    errorHandler(error, details) {
      show(this.loadingDiv, false);
      show(this.helpDiv, false);
      show(this.previewDiv, true);
      let message;
      if (typeof error === "string") {
        message = error;
      } else if (typeof error.message === "string") {
        message = error.message;
      } else {
        try {
          message = error.toString();
        } catch {
          message = "Unknown error";
        }
      }
      if (this.sandboxReady) {
        const markdown = `# Error:
${message}

${details}`;
        this.renderMarkdown(markdown);
      } else {
        this.previewDiv.innerHTML = "";
        const h1 = document.createElement("h1");
        h1.textContent = "Error";
        const pMessage = document.createElement("p");
        pMessage.textContent = message;
        const pDetails = document.createElement("p");
        pDetails.textContent = details;
        this.previewDiv.appendChild(h1);
        this.previewDiv.appendChild(pMessage);
        this.previewDiv.appendChild(pDetails);
      }
    }
    render(title, markdown, interactiveDocument, showRestart) {
      if (this.toolbar) {
        this.toolbar.filename = title;
      }
      let didError = false;
      if (interactiveDocument) {
        this.onSetMode("json", null, interactiveDocument);
        this.renderInteractiveDocument(interactiveDocument);
      } else if (markdown) {
        this.onSetMode("markdown", markdown, null);
        this.renderMarkdown(markdown);
      } else {
        this.errorHandler(
          "No content provided",
          "Please provide either markdown or an interactive document to render."
        );
        didError = true;
      }
      if (this.toolbar && showRestart) {
        this.toolbar.showRestartButton();
      }
      if (!didError) {
        if (this.toolbar) {
          this.toolbar.showTweakButton();
          this.toolbar.showDownloadButton();
        }
      }
      this.removeInteractionHandlers.forEach((removeHandler) => removeHandler());
      this.removeInteractionHandlers = [];
    }
    renderInteractiveDocument(content) {
      postStatus(this.options.postMessageTarget, { type: "hostStatus", hostStatus: "compiling", details: "Starting interactive document compilation" });
      const markdown = targetMarkdown(content);
      this.renderMarkdown(markdown);
    }
    hideLoadingAndHelp() {
      show(this.loadingDiv, false);
      show(this.helpDiv, false);
    }
    renderMarkdown(markdown) {
      this.hideLoadingAndHelp();
      try {
        postStatus(this.options.postMessageTarget, { type: "hostStatus", hostStatus: "rendering", details: "Starting markdown rendering" });
        if (!this.sandbox || !this.sandboxReady) {
          this.createSandbox(markdown);
        } else {
          this.sandbox.send(markdown);
        }
        show(this.sandbox.element, true);
        postStatus(this.options.postMessageTarget, { type: "hostStatus", hostStatus: "rendered", details: "Markdown rendering completed successfully" });
      } catch (error) {
        this.errorHandler(
          error,
          "Error rendering markdown content"
        );
        postStatus(this.options.postMessageTarget, { type: "hostStatus", hostStatus: "error", details: `Rendering failed: ${error.message}` });
      }
    }
  }
  const index$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Listener
  }, Symbol.toStringTag, { value: "Module" }));
  class Toolbar {
    constructor(toolbarElementOrSelector, options = {}) {
      __publicField(this, "options");
      __publicField(this, "toolbarElement");
      __publicField(this, "folderSpan");
      __publicField(this, "tweakButton");
      __publicField(this, "restartButton");
      __publicField(this, "downloadButton");
      __publicField(this, "mode");
      __publicField(this, "filename");
      var _a, _b, _c;
      this.options = options;
      this.filename = options.filename || "sample";
      this.mode = options.mode || "markdown";
      this.toolbarElement = typeof toolbarElementOrSelector === "string" ? document.querySelector(toolbarElementOrSelector) : toolbarElementOrSelector;
      if (!this.toolbarElement) {
        throw new Error("Toolbar element not found");
      }
      const html = `
<div>
    <a href="https://microsoft.github.io/chartifact" target="_blank">Chartifact</a> viewer
</div>
<div id="folderSpan" style="display: none;"></div>
<div>
    <button type="button" id="restart" style="display: none;">start over</button>
    <button type="button" id="tweak" style="display: none;">view source</button>
    <button type="button" id="download" style="display: none;">download</button>
</div>
        `;
      this.toolbarElement.innerHTML = html;
      this.folderSpan = this.toolbarElement.querySelector("#folderSpan");
      this.tweakButton = this.toolbarElement.querySelector("#tweak");
      this.restartButton = this.toolbarElement.querySelector("#restart");
      this.downloadButton = this.toolbarElement.querySelector("#download");
      if (this.options.tweakButton) {
        this.showTweakButton();
      }
      if (this.options.restartButton) {
        this.showRestartButton();
      }
      if (this.options.downloadButton) {
        this.showDownloadButton();
      }
      (_a = this.tweakButton) == null ? void 0 : _a.addEventListener("click", () => {
        this.options.textarea.style.display = this.options.textarea.style.display === "none" ? "" : "none";
      });
      (_b = this.restartButton) == null ? void 0 : _b.addEventListener("click", () => {
        window.location.reload();
      });
      (_c = this.downloadButton) == null ? void 0 : _c.addEventListener("click", () => {
        const textarea = this.options.textarea;
        if (!textarea)
          return;
        const content = textarea.value;
        const ext = this.mode === "markdown" ? "idoc.md" : "idoc.json";
        const filename = `${filenameWithoutPathOrExtension(this.filename)}.${ext}`;
        const blob = new Blob([content], {
          type: this.mode === "markdown" ? "text/markdown" : "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
      });
    }
    showTweakButton() {
      this.tweakButton.style.display = "";
    }
    showRestartButton() {
      this.restartButton.style.display = "";
    }
    showDownloadButton() {
      this.downloadButton.style.display = "";
    }
    manageTextareaVisibilityForAgents() {
      const { textarea } = this.options;
      if (!textarea) {
        throw new Error("Textarea element not found");
      }
      textarea.style.flex = "0";
      textarea.style.padding = "0";
      textarea.style.border = "0";
      setTimeout(() => {
        textarea.style.flex = "";
        textarea.style.padding = "";
        textarea.style.border = "";
        textarea.style.display = "none";
      }, 300);
    }
  }
  function filenameWithoutPathOrExtension(filename) {
    const base = filename.split(/[\\/]/).pop() || filename;
    const idocIdx = base.indexOf(".idoc");
    if (idocIdx !== -1) {
      return base.substring(0, idocIdx);
    }
    const lastDot = base.lastIndexOf(".");
    if (lastDot > 0) {
      return base.substring(0, lastDot);
    }
    return base;
  }
  function create(toolbarElementOrSelector, options = {}) {
    const toolbar = new Toolbar(toolbarElementOrSelector, options);
    toolbar.manageTextareaVisibilityForAgents();
    return toolbar;
  }
  const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Toolbar,
    create
  }, Symbol.toStringTag, { value: "Module" }));
  exports2.common = index$4;
  exports2.compiler = index$3;
  exports2.host = index$1;
  exports2.sandbox = index$2;
  exports2.toolbar = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
