(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory((global.IDocs = global.IDocs || {}, global.IDocs.compiler = {})));
})(this, function(exports2) {
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
  exports2.changePageOrigin = changePageOrigin;
  exports2.targetMarkdown = targetMarkdown;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
