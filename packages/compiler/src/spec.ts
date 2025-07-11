import { Spec as VegaSpec } from 'vega-typings';
import { Variable, DataLoader } from "schema";
import { SourceData, ValuesData, Signal } from "vega";
import { topologicalSort } from "./sort.js";

export const $schema = "https://vega.github.io/schema/vega/v5.json";

export function createSpecWithVariables(dataNameSelectedSuffix: string, variables: Variable[], stubDataLoaders?: DataLoader[]) {

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
                name: dl.dataSourceName + dataNameSelectedSuffix,
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
