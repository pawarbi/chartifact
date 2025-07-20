(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("sandbox")) : typeof define === "function" && define.amd ? define(["exports", "sandbox"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory((global.IDocs = global.IDocs || {}, global.IDocs.host = {}), global.IDocs.sandbox));
})(this, function(exports2, sandbox) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  function _interopNamespaceDefault(e) {
    const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
    if (e) {
      for (const k in e) {
        if (k !== "default") {
          const d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: () => e[k]
          });
        }
      }
    }
    n.default = e;
    return Object.freeze(n);
  }
  const sandbox__namespace = /* @__PURE__ */ _interopNamespaceDefault(sandbox);
  function safeVariableName(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }
  function getChartType(spec) {
    const $schema2 = spec == null ? void 0 : spec.$schema;
    if (!$schema2) {
      return "vega-lite";
    }
    return $schema2.includes("vega-lite") ? "vega-lite" : "vega";
  }
  function changePageOrigin(page, oldOrigin, newOriginUrl) {
    const newPage = {
      ...page,
      dataLoaders: page.dataLoaders.map((loader) => {
        if (loader.type === "url" && loader.urlRef.origin === oldOrigin) {
          return {
            ...loader,
            urlRef: {
              ...loader.urlRef,
              origin: newOriginUrl.origin
            }
          };
        }
        return loader;
      }),
      groups: page.groups.map((group) => ({
        ...group,
        elements: group.elements.map((element) => {
          if (typeof element === "object" && element.type === "image" && element.urlRef.origin === oldOrigin) {
            const newImageElement = {
              ...element,
              urlRef: {
                ...element.urlRef,
                origin: newOriginUrl.origin
              }
            };
            return newImageElement;
          }
          return element;
        })
      }))
    };
    return newPage;
  }
  function addStaticDataLoaderToSpec(vegaScope, dataSource) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;
    if (!spec.signals) {
      spec.signals = [];
    }
    spec.signals.push({
      name: dataSourceName,
      update: `data('${dataSourceName}')`
    });
    if (!spec.data) {
      spec.data = [];
    }
    const newData = {
      name: dataSourceName,
      values: []
    };
    if (dataSource.type === "json") {
      newData.values = dataSource.content;
    } else if (dataSource.type === "file") {
      newData.format = {
        type: dataSource.format
      };
      newData.values = [dataSource.content];
    }
    spec.data.push(newData);
  }
  function addDynamicDataLoaderToSpec(vegaScope, dataSource) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;
    const urlSignal = vegaScope.createUrlSignal(dataSource.urlRef);
    const url = { signal: urlSignal.name };
    if (!spec.signals) {
      spec.signals = [];
    }
    spec.signals.push({
      name: dataSourceName,
      update: `data('${dataSourceName}')`
    });
    if (!spec.data) {
      spec.data = [];
    }
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
    addOrigin(origin) {
      if (!this.spec.signals) {
        this.spec.signals = [];
      }
      let origins = this.spec.signals.find((d) => d.name === "origins");
      if (!origins) {
        origins = {
          name: "origins",
          value: {}
        };
        this.spec.signals.unshift(origins);
      }
      origins.value[origin] = origin;
    }
    createUrlSignal(urlRef) {
      const { origin, urlPath, mappedParams } = urlRef;
      const name = `url:${this.urlCount++}:${safeVariableName(origin + urlPath)}`;
      const signal = { name };
      this.addOrigin(origin);
      signal.update = `origins[${JSON.stringify(origin)}]+'${urlPath}'`;
      if (mappedParams && mappedParams.length > 0) {
        signal.update += ` + '?' + ${mappedParams.map((p) => `urlParam('${p.name}', ${variableValueExpression(p)})`).join(` + '&' + `)}`;
      }
      if (!this.spec.signals) {
        this.spec.signals = [];
      }
      this.spec.signals.push(signal);
      return signal;
    }
  }
  function variableValueExpression(param) {
    if (param.variableId) {
      return param.variableId;
    } else if (param.calculation) {
      return "(" + param.calculation.vegaExpression + ")";
    } else {
      return JSON.stringify(param.value);
    }
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
  function createSpecWithVariables(dataNameSelectedSuffix, variables, stubDataLoaders) {
    const spec = {
      $schema: "https://vega.github.io/schema/vega/v5.json",
      signals: [],
      data: []
    };
    topologicalSort(variables).forEach((v) => {
      if (isDataframePipeline(v)) {
        const { dataFrameTransformations } = v.calculation;
        const data = {
          name: v.variableId,
          source: v.calculation.dependsOn || [],
          transform: dataFrameTransformations
        };
        spec.data.push(data);
        if (!spec.signals) {
          spec.signals = [];
        }
        spec.signals.push({
          name: v.variableId,
          update: `data('${v.variableId}')`
        });
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
  const defaultCommonOptions = {
    dataNameSelectedSuffix: "_selected",
    groupClassName: "group"
  };
  function tickWrap(tick, content) {
    return `\`\`\`${tick}
${content}
\`\`\``;
  }
  function jsonWrap(type, content) {
    return tickWrap("json " + type, content);
  }
  function chartWrap(spec) {
    const chartType = getChartType(spec);
    return jsonWrap(chartType, JSON.stringify(spec, null, 4));
  }
  function mdContainerWrap(classname, id, content) {
    return `::: ${classname} {#${id}}
${content}
:::`;
  }
  const $schema = "https://vega.github.io/schema/vega/v5.json";
  function targetMarkdown(page) {
    var _a;
    const mdSections = [];
    const dataLoaders = page.dataLoaders || [];
    const variables = page.variables || [];
    if ((_a = page.layout) == null ? void 0 : _a.css) {
      mdSections.push(tickWrap("css", page.layout.css));
    }
    const vegaScope = dataLoaderMarkdown(dataLoaders.filter((dl) => dl.type !== "spec"), variables);
    for (const dataLoader of dataLoaders.filter((dl) => dl.type === "spec")) {
      mdSections.push(chartWrap(dataLoader.spec));
    }
    for (const group of page.groups) {
      mdSections.push(mdContainerWrap(defaultCommonOptions.groupClassName, group.groupId, groupMarkdown(group, variables, vegaScope)));
    }
    mdSections.unshift(chartWrap(vegaScope.spec));
    const markdown = mdSections.join("\n\n");
    return markdown;
  }
  function dataLoaderMarkdown(dataSources, variables) {
    const spec = createSpecWithVariables(defaultCommonOptions.dataNameSelectedSuffix, variables);
    const vegaScope = new VegaScope(spec);
    for (const dataSource of dataSources) {
      switch (dataSource.type) {
        case "json": {
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
      if (!spec.data) {
        spec.data = [];
      }
      spec.data.unshift({
        name: dataSource.dataSourceName + defaultCommonOptions.dataNameSelectedSuffix
      });
    }
    return vegaScope;
  }
  function groupMarkdown(group, variables, vegaScope) {
    var _a, _b, _c, _d;
    const mdElements = [];
    for (const element of group.elements) {
      if (typeof element === "string") {
        mdElements.push(element);
      } else if (typeof element === "object") {
        switch (element.type) {
          case "chart": {
            const chartFull = element.chart;
            if (!chartFull.spec) {
              mdElements.push("![Chart Spinner](/img/chart-spinner.gif)");
            } else {
              mdElements.push(chartWrap(chartFull.spec));
            }
            break;
          }
          case "checkbox": {
            const cbSpec = {
              name: element.variableId,
              value: (_a = variables.find((v) => v.variableId === element.variableId)) == null ? void 0 : _a.initialValue,
              label: element.label
            };
            mdElements.push(jsonWrap("checkbox", JSON.stringify(cbSpec, null, 2)));
            break;
          }
          case "dropdown": {
            const ddSpec = {
              name: element.variableId,
              value: (_b = variables.find((v) => v.variableId === element.variableId)) == null ? void 0 : _b.initialValue,
              label: element.label
            };
            if (element.dynamicOptions) {
              ddSpec.dynamicOptions = {
                dataSignalName: element.dynamicOptions.dataSourceName,
                fieldName: element.dynamicOptions.fieldName
              };
            } else {
              ddSpec.options = element.options;
            }
            if (element.multiple) {
              ddSpec.multiple = element.multiple;
              ddSpec.size = element.size || 1;
            }
            mdElements.push(jsonWrap("dropdown", JSON.stringify(ddSpec, null, 2)));
            break;
          }
          case "image": {
            const urlSignal = vegaScope.createUrlSignal(element.urlRef);
            const imageSpec = {
              srcSignalName: urlSignal.name,
              alt: element.alt,
              width: element.width,
              height: element.height
            };
            mdElements.push(jsonWrap("image", JSON.stringify(imageSpec, null, 2)));
            break;
          }
          case "presets": {
            const presetsSpec = element.presets;
            mdElements.push(jsonWrap("presets", JSON.stringify(presetsSpec, null, 2)));
            break;
          }
          case "slider": {
            const spec = {
              $schema,
              signals: [
                {
                  name: element.variableId,
                  value: (_c = variables.find((v) => v.variableId === element.variableId)) == null ? void 0 : _c.initialValue,
                  bind: {
                    input: "range",
                    min: element.min,
                    max: element.max,
                    step: element.step,
                    debounce: 100
                  }
                }
              ]
            };
            mdElements.push(chartWrap(spec));
            break;
          }
          case "table": {
            const tableSpec = {
              dataSignalName: element.dataSourceName,
              options: element.options
            };
            mdElements.push(jsonWrap("tabulator", JSON.stringify(tableSpec, null, 2)));
            break;
          }
          case "textbox": {
            const spec = {
              $schema,
              signals: [
                {
                  name: element.variableId,
                  value: (_d = variables.find((v) => v.variableId === element.variableId)) == null ? void 0 : _d.initialValue,
                  bind: {
                    input: "text",
                    debounce: 100
                  }
                }
              ]
            };
            mdElements.push(chartWrap(spec));
            break;
          }
        }
      }
    }
    const markdown = mdElements.join("\n\n");
    return markdown;
  }
  const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    changePageOrigin,
    targetMarkdown
  }, Symbol.toStringTag, { value: "Module" }));
  function readFile(file, host) {
    if (file.name.endsWith(".json") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        var _a;
        let content = (_a = e.target) == null ? void 0 : _a.result;
        if (!content) {
          host.errorHandler(
            new Error("File content is empty"),
            "The file is empty. Please use a valid markdown or JSON file."
          );
          return;
        }
        content = content.trim();
        if (!content) {
          host.errorHandler(
            new Error("File content is empty"),
            "The file is empty or contains only whitespace. Please use a valid markdown or JSON file."
          );
          return;
        }
        if (file.name.endsWith(".json")) {
          try {
            const idoc = JSON.parse(content);
            host.render(void 0, idoc);
            return;
          } catch (jsonError) {
            host.errorHandler(
              new Error("Invalid JSON content"),
              "The file content is not valid JSON."
            );
            return;
          }
        } else if (file.name.endsWith(".md")) {
          host.render(content);
        }
      };
      reader.onerror = (e) => {
        host.errorHandler(new Error("Failed to read file"), "Error reading file");
      };
      reader.readAsText(file);
    } else {
      host.errorHandler(
        new Error("Invalid file type"),
        "Only markdown (.md) or JSON (.json) files are supported."
      );
    }
  }
  function determineContent(content, host) {
    if (!content) {
      host.errorHandler(
        new Error("Content is empty"),
        "The content was empty. Please use valid markdown content or JSON."
      );
      return;
    }
    if (typeof content !== "string") {
      host.errorHandler(
        new Error("Invalid content type"),
        "The content is not a string. Please use valid markdown content or JSON."
      );
      return;
    }
    content = content.trim();
    if (!content) {
      host.errorHandler(
        new Error("Content is empty"),
        "The content was only whitespace. Please use valid markdown content or JSON."
      );
      return;
    }
    if (content.startsWith("{") && content.endsWith("}")) {
      try {
        const idoc = JSON.parse(content);
        host.render(void 0, idoc);
      } catch (jsonError) {
        host.errorHandler(
          new Error("Invalid JSON content in clipboard"),
          "The pasted content is not valid JSON. Please copy a valid interactive document JSON file."
        );
        return;
      }
    } else {
      host.render(content);
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
                  new Error("Pasted content is empty"),
                  "The pasted content was empty. Please paste valid markdown content or JSON."
                );
                return;
              }
              content = content.trim();
              if (!content) {
                host.errorHandler(
                  new Error("Pasted content is empty"),
                  "The pasted content was only whitespace. Please paste valid markdown content or JSON."
                );
                return;
              }
              determineContent(content, host);
            });
            handled = true;
            break;
          }
        }
        if (!handled) {
          host.errorHandler(
            new Error("Unsupported clipboard content"),
            "Please paste a markdown file, JSON file, or valid text content."
          );
        }
      } else {
        host.errorHandler(
          new Error("Unsupported clipboard content"),
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
            new Error("Dropped content is empty"),
            "The dropped content was empty. Please drop valid markdown content or JSON."
          );
          return;
        }
        content = content.trim();
        if (!content) {
          host.errorHandler(
            new Error("Dropped content is empty"),
            "The dropped content was only whitespace. Please drop valid markdown content or JSON."
          );
          return;
        }
        determineContent(content, host);
      } else {
        host.errorHandler(
          new Error("Unsupported drop content"),
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
        new Error("Upload button or file input not found"),
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
          new Error("No file selected"),
          "Please select a markdown or JSON file to upload."
        );
      }
    });
  }
  function checkUrlForFile(host) {
    const urlParams = new URLSearchParams(window.location.search);
    const loadUrl = urlParams.get(host.options.urlParamName);
    const isValidUrl = (url) => isSameOrigin(url) || isHttps(url);
    if (loadUrl && !isValidUrl(loadUrl)) {
      host.errorHandler(
        new Error(`Invalid URL: ${loadUrl}`),
        "The URL provided is not valid. Please ensure it is on the same origin or uses HTTPS."
      );
      return false;
    }
    if (loadUrl) {
      try {
        fetch(loadUrl).then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load ${loadUrl}`);
          }
          return response.text();
        }).then((content) => {
          determineContent(content, host);
        }).catch((error) => {
          host.errorHandler(error, `Error loading file: ${loadUrl}`);
        });
      } catch (error) {
        host.errorHandler(error, `Error loading file: ${loadUrl}`);
      }
      return true;
    } else {
      return false;
    }
  }
  function isSameOrigin(url) {
    const link = document.createElement("a");
    link.href = url;
    return link.origin === window.location.origin;
  }
  function isHttps(url) {
    const link = document.createElement("a");
    link.href = url;
    return link.protocol === "https:";
  }
  function setupPostMessageHandling(host) {
    window.addEventListener("message", (event) => {
      try {
        if (!event.data || typeof event.data !== "object") {
          host.errorHandler(
            new Error("Invalid message format"),
            "Received message is not an object or is undefined."
          );
          return;
        }
        const data = event.data;
        if (data.markdown) {
          host.render(data.markdown, void 0);
        } else if (data.interactiveDocument) {
          host.render(void 0, data.interactiveDocument);
        } else {
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
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now()
      };
      target.postMessage(messageWithTimestamp, "*");
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
      __publicField(this, "appDiv");
      __publicField(this, "loadingDiv");
      __publicField(this, "helpDiv");
      __publicField(this, "uploadButton");
      __publicField(this, "fileInput");
      __publicField(this, "textarea");
      __publicField(this, "sandbox");
      __publicField(this, "removeInteractionHandlers");
      __publicField(this, "sandboxReady", false);
      this.options = { ...defaultOptions, ...options == null ? void 0 : options.options };
      this.removeInteractionHandlers = [];
      this.appDiv = getElement(options.app);
      this.loadingDiv = getElement(options.loading);
      this.helpDiv = getElement(options.help);
      this.uploadButton = getElement(options.uploadButton);
      this.fileInput = getElement(options.fileInput);
      this.textarea = getElement(options.textarea);
      if (!this.appDiv) {
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
      this.sandbox = new sandbox.Sandbox(this.appDiv, markdown, {
        onReady: () => {
          this.sandboxReady = true;
          postStatus(this.options.postMessageTarget, { status: "ready" });
        },
        onError: () => {
          this.errorHandler(new Error("Sandbox initialization failed"), "Sandbox could not be initialized");
        }
      });
    }
    errorHandler(error, detailsHtml) {
      show(this.loadingDiv, false);
      this.appDiv.innerHTML = `<div style="color: red; padding: 20px;">
    <strong>Error:</strong> ${error.message}<br>
      ${detailsHtml}
    </div>`;
    }
    bindTextareaToCompiler() {
      const render = () => {
        const json = this.textarea.value;
        try {
          const interactiveDocument = JSON.parse(json);
          if (typeof interactiveDocument !== "object") {
            this.errorHandler(new Error("Invalid JSON format"), "Please provide a valid Interactive Document JSON.");
            return;
          }
          this.renderInteractiveDocument(interactiveDocument);
        } catch (error) {
          this.errorHandler(error, "Failed to parse Interactive Document JSON");
        }
      };
      this.textarea.addEventListener("input", render);
      render();
    }
    bindTextareaToMarkdown() {
      const render = () => {
        const markdown = this.textarea.value;
        this.renderMarkdown(markdown);
      };
      this.textarea.addEventListener("input", render);
      render();
    }
    render(markdown, interactiveDocument) {
      if (interactiveDocument) {
        if (this.textarea) {
          this.textarea.value = JSON.stringify(interactiveDocument, null, 2);
          this.hideLoadingAndHelp();
          this.bindTextareaToCompiler();
        } else {
          this.renderInteractiveDocument(interactiveDocument);
        }
      } else if (markdown) {
        if (this.textarea) {
          this.textarea.value = markdown;
          this.hideLoadingAndHelp();
          this.bindTextareaToMarkdown();
        } else {
          this.renderMarkdown(markdown);
        }
      } else {
        this.errorHandler(new Error("No content provided"), "Please provide either markdown or an interactive document to render.");
      }
      this.removeInteractionHandlers.forEach((removeHandler) => removeHandler());
      this.removeInteractionHandlers = [];
    }
    renderInteractiveDocument(content) {
      postStatus(this.options.postMessageTarget, { status: "compiling", details: "Starting interactive document compilation" });
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
        postStatus(this.options.postMessageTarget, { status: "rendering", details: "Starting markdown rendering" });
        if (!this.sandbox || !this.sandboxReady) {
          this.createSandbox(markdown);
        } else {
          this.sandbox.send(markdown);
        }
        postStatus(this.options.postMessageTarget, { status: "rendered", details: "Markdown rendering completed successfully" });
      } catch (error) {
        this.errorHandler(
          error,
          "Error rendering markdown content"
        );
        postStatus(this.options.postMessageTarget, { status: "error", details: `Rendering failed: ${error.message}` });
      }
    }
  }
  exports2.sandbox = sandbox__namespace;
  exports2.Listener = Listener;
  exports2.compiler = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
