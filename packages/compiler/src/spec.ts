import { Spec as VegaSpec } from 'vega-typings';
import { Variable, DataLoader, TableElement } from '@microsoft/chartifact-schema';
import { SourceData, ValuesData, Signal, NewSignal } from "vega";
import { topologicalSort } from "./sort.js";

export const $schema = "https://vega.github.io/schema/vega/v5.json";

export function createSpecWithVariables(variables: Variable[], tableElements: TableElement[], stubDataLoaders?: DataLoader[]) {

    //preload with variables as signals
    const spec: VegaSpec = {
        $schema: "https://vega.github.io/schema/vega/v5.json",
        signals: [],
        data: [],
    };

    //add table elements as data sources
    tableElements.forEach((table) => {
        const { variableId } = table;
        spec.signals.push(dataAsSignal(variableId));
        spec.data.unshift({
            name: variableId,
            values: [],
        });
    });

    //ensure (fake) data loaders are at the beginning of the data array
    if (stubDataLoaders) {
        //add data loaders as both signals and data sources
        stubDataLoaders.filter(dl => dl.type !== 'spec').forEach((dl) => {
            spec.signals.push(dataAsSignal(dl.dataSourceName));
            spec.data.push({
                name: dl.dataSourceName,
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
            spec.data.push(data);
            spec.signals.push(dataAsSignal(v.variableId));
        } else {
            const signal: Signal = { name: v.variableId, value: v.initialValue };
            if (v.calculation) {
                signal.update = v.calculation!.vegaExpression;
            }
            spec.signals.push(signal);
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

export function ensureDataAndSignalsArray(spec: VegaSpec) {
    if (!spec.data) {
        spec.data = [];
    }
    if (!spec.signals) {
        spec.signals = [];
    }
}

export function dataAsSignal(name: string): NewSignal {
    return {
        name,
        update: `data('${name}')`
    };
}   
