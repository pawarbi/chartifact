import { Spec as VegaSpec } from 'vega-typings';
import { DataSourceByDynamicURL, DataLoader, MappedNameValuePairs, UrlRef, Variable, DataSourceByFile, DataSourceByJSON } from 'dsl';
import { NewSignal, Signal, SignalRef, SourceData, ValuesData } from 'vega';
import { safeVariableName } from './util.js';
import { common } from '@microsoft/interactive-document-markdown';

export class VegaScope {
    private urlCount = 0;

    constructor(public spec: VegaSpec) { }

    private addOrigin(origin: string) {
        if (!this.spec.signals) {
            this.spec.signals = [];
        }
        let origins = this.spec.signals.find(d => d.name === 'origins') as NewSignal;
        if (!origins) {
            origins = {
                name: 'origins',
                value: {},
            };
            this.spec.signals.unshift(origins); //add to the beginning of the signals array
        }
        origins.value[origin] = origin;
    }

    createUrlSignal(urlRef: UrlRef) {
        const { origin, urlPath, mappedParams } = urlRef;
        const name = `url:${this.urlCount++}:${safeVariableName(origin + urlPath)}`;
        const signal: NewSignal = { name };

        //TODO parse via URL object to get the actual base url

        this.addOrigin(origin);

        signal.update = `origins[${JSON.stringify(origin)}]+'${urlPath}'`;

        if (mappedParams && mappedParams.length > 0) {
            signal.update += ` + '?' + ${mappedParams.map(p => `urlParam('${p.name}', ${variableValueExpression(p)})`).join(` + '&' + `)}`;
        }

        if (!this.spec.signals) {
            this.spec.signals = [];
        }
        this.spec.signals.push(signal);
        return signal;
    }
}

export function variableValueExpression(param: MappedNameValuePairs) {
    if (param.variableId) {
        return param.variableId;
    } else if (param.calculation) {
        return '(' + param.calculation.vegaExpression + ')';
    } else {
        return JSON.stringify(param.value);
    }
}

export function addStaticDataLoaderToSpec(vegaScope: VegaScope, dataSource: DataSourceByJSON | DataSourceByFile) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;

    if (!spec.signals) {
        spec.signals = [];
    }
    spec.signals.push(
        {
            name: dataSourceName,
            update: `data('${dataSourceName}')`
        }
    );

    //real data goes to the beginning of the data array
    if (!spec.data) {
        spec.data = [];
    }

    const newData: ValuesData = {
        name: dataSourceName,
        values: [],
    };

    if (dataSource.type === 'json') {
        newData.values = dataSource.content;
    } else if (dataSource.type === 'file') {
        newData.format = {
            type: dataSource.format
        };
        newData.values = [dataSource.content];
    }

    spec.data.push(newData);
}

export function addDynamicDataLoaderToSpec(vegaScope: VegaScope, dataSource: DataSourceByDynamicURL) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;

    const urlSignal = vegaScope.createUrlSignal(dataSource.urlRef);
    const url: SignalRef = { signal: urlSignal.name };

    if (!spec.signals) {
        spec.signals = [];
    }
    spec.signals.push(
        {
            name: dataSourceName,
            update: `data('${dataSourceName}')`
        }
    );

    //real data goes to the beginning of the data array
    if (!spec.data) {
        spec.data = [];
    }
    spec.data.unshift({
        name: dataSourceName,
        url,
        format: { type: dataSource.format || 'json' },
        transform: dataSource.dataFrameTransformations || [],
    });
}

export function createSpecWithVariables(variables: Variable[], stubDataLoaders?: DataLoader[]) {

    //preload with variables as signals
    const spec: VegaSpec = {
        $schema: "https://vega.github.io/schema/vega/v5.json",
        signals: [],
        data: [],
    };

    //ensure (fake) data loaders are at the beginning of the data array
    if (stubDataLoaders) {
        //add data loaders as both signals and data sources
        stubDataLoaders.filter(dl => dl.type !== 'spec').forEach((dl) => {
            spec.signals!.push({
                name: dl.dataSourceName,
                value: `data('${dl.dataSourceName}')`,
            });
            spec.data!.push({
                name: dl.dataSourceName,
                values: [],
            });

            //add a special "-selected" data item
            spec.data!.push({
                name: dl.dataSourceName + common.dataNameSelectedSuffix,
                values: [],
            });
        });
    }

    topologicalSort(variables).forEach((v) => {
        if (isDataframePipeline(v)) {
            const { dataFrameTransformations } = v.calculation!;
            const data: SourceData & Partial<ValuesData> = {
                name: v.variableId,
                source: v.calculation!.dependsOn || [],
                transform: dataFrameTransformations,
            };
            spec.data!.push(data);
            if (!spec.signals) {
                spec.signals = [];
            }
            spec.signals.push({
                name: v.variableId,
                update: `data('${v.variableId}')`,
            });
        } else {
            const signal: Signal = { name: v.variableId, value: v.initialValue };
            if (v.calculation) {
                signal.update = v.calculation!.vegaExpression;
            }
            spec.signals!.push(signal);
        }
    });

    return spec;
}

function isDataframePipeline(variable: Variable): boolean {
    return variable.type === 'object'
        && !!variable.isArray
        && (
            (variable.calculation?.dependsOn !== undefined && variable.calculation.dependsOn.length > 0)
            || (variable.calculation?.dataFrameTransformations !== undefined && variable.calculation.dataFrameTransformations.length > 0)
        );
}

function topologicalSort(list: Variable[]) {
    const nameToObject = new Map<string, Variable>();
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    for (const obj of list) {
        nameToObject.set(obj.variableId, obj);
        inDegree.set(obj.variableId, 0);
        graph.set(obj.variableId, []);
    }

    for (const obj of list) {
        const sources = obj.calculation?.dependsOn || [];

        for (const dep of sources) {
            if (!graph.has(dep)) {
                continue; // Skip if the dependency is not in the list
            }
            graph.get(dep)!.push(obj.variableId);
            inDegree.set(obj.variableId, inDegree.get(obj.variableId)! + 1);
        }
    }

    const queue: string[] = [];
    for (const [name, degree] of inDegree.entries()) {
        if (degree === 0) queue.push(name);
    }

    const sorted: Variable[] = [];
    while (queue.length) {
        const current = queue.shift()!;
        sorted.push(nameToObject.get(current)!);

        for (const neighbor of graph.get(current)!) {
            inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
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
