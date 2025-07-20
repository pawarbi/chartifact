(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("react"), require("sandbox")) : typeof define === "function" && define.amd ? define(["exports", "react", "sandbox"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory((global.IDocs = global.IDocs || {}, global.IDocs.editor = {}), global.React, global.IDocs.sandbox));
})(this, function(exports2, React$1, sandbox) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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
          this.sandboxRef = new (this.props.previewer || sandbox.Sandbox)(
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
              onError: (error) => console.error("Sandbox initialization failed:", error)
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
          if (event.data.type === "page" && event.data.page) {
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
        type: "ready",
        sender: "editor"
      };
      postMessageTarget.postMessage(readyMessage, "*");
    }, []);
    return /* @__PURE__ */ React.createElement(EditorView, { page, postMessageTarget, previewer: props.previewer });
  }
  function EditorView(props) {
    const { page, postMessageTarget, previewer } = props;
    const sendEditToApp = (newPage) => {
      const pageMessage = {
        type: "page",
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
        previewer
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
        type: "page",
        page,
        sender: "app"
      };
      window.postMessage(pageMessage, "*");
    };
    React.useEffect(() => {
      const handleMessage = (event) => {
        if (event.data && event.data.sender === "editor") {
          if (event.data.type === "ready") {
            setIsEditorReady(true);
            sendPageToEditor(currentPage);
          } else if (event.data.type === "page" && event.data.page) {
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
        previewer
      }
    )));
  }
  const initialPage = {
    title: "Sample Page",
    layout: {
      css: "body, .body { background: beige; padding: 8px; margin: 0; }"
    },
    groups: [
      {
        groupId: "main",
        elements: [
          "# Welcome to Interactive Documents",
          "1 This is a sample page loaded via postMessage.",
          "2 This is a sample page loaded via postMessage.",
          {
            type: "chart",
            chart: {
              chartIntent: "bar chart",
              chartTemplateKey: "default-bar-chart",
              dataSourceBase: {
                dataSourceName: "seattle-weather"
              },
              spec: {
                "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
                "data": { "url": "https://vega.github.io/editor/data/seattle-weather.csv" },
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
            }
          },
          "3 This is a sample page loaded via postMessage.",
          "The App component controls what content is displayed."
        ]
      }
    ]
  };
  exports2.App = App;
  exports2.Editor = Editor;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
