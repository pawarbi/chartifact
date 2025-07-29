(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.IDocs = global.IDocs || {}));
})(this, function(exports2) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  const defaultCommonOptions = {
    dataSignalPrefix: "data_signal:",
    groupClassName: "group"
  };
  const index$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    defaultCommonOptions
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
      if (degree === 0) queue.push(name);
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
    if (dataSource.type === "json") {
      newData.values = dataSource.content;
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
    const urlSignal = vegaScope.createUrlSignal(dataSource.urlRef);
    const url = { signal: urlSignal.name };
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
  function targetMarkdown(page) {
    var _a;
    const mdSections = [];
    const dataLoaders = page.dataLoaders || [];
    const variables = page.variables || [];
    if ((_a = page.layout) == null ? void 0 : _a.css) {
      mdSections.push(tickWrap("css", page.layout.css));
    }
    const tableElements = page.groups.flatMap((group) => group.elements.filter((e) => typeof e !== "string" && e.type === "table"));
    const vegaScope = dataLoaderMarkdown(dataLoaders.filter((dl) => dl.type !== "spec"), variables, tableElements);
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
  function dataLoaderMarkdown(dataSources, variables, tableElements) {
    const spec = createSpecWithVariables(variables, tableElements);
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
    }
    return vegaScope;
  }
  function groupMarkdown(group, variables, vegaScope) {
    var _a, _b, _c, _d;
    const mdElements = [];
    const addSpec = (pluginName, spec) => {
      mdElements.push(jsonWrap(pluginName, JSON.stringify(spec, null, 2)));
    };
    for (const element of group.elements) {
      if (typeof element === "string") {
        mdElements.push(element);
      } else if (typeof element === "object") {
        switch (element.type) {
          case "chart": {
            const { chart } = element;
            const chartFull = chart;
            if (!chartFull.spec) {
              mdElements.push("![Chart Spinner](/img/chart-spinner.gif)");
            } else {
              mdElements.push(chartWrap(chartFull.spec));
            }
            break;
          }
          case "checkbox": {
            const { label, variableId } = element;
            const cbSpec = {
              variableId,
              value: (_a = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _a.initialValue,
              label
            };
            addSpec("checkbox", cbSpec);
            break;
          }
          case "dropdown": {
            const { label, variableId, options, dynamicOptions, multiple, size } = element;
            const ddSpec = {
              variableId,
              value: (_b = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _b.initialValue,
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
            const { urlRef, alt, width, height } = element;
            const urlSignal = vegaScope.createUrlSignal(urlRef);
            const imageSpec = {
              srcSignalName: urlSignal.name,
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
              value: (_c = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _c.initialValue,
              label,
              min,
              max,
              step
            };
            addSpec("slider", sliderSpec);
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
              value: (_d = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _d.initialValue,
              label,
              multiline,
              placeholder
            };
            addSpec("textbox", textboxSpec);
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
  exports2.common = index$1;
  exports2.compiler = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
