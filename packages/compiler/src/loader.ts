/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { DataSourceByDynamicURL, DataSourceByFile, DataSourceByJSON } from '@microsoft/chartifact-schema';
import { SignalRef, ValuesData } from 'vega';
import { VegaScope } from './scope.js';
import { dataAsSignal, ensureDataAndSignalsArray } from './spec.js';

export function addStaticDataLoaderToSpec(vegaScope: VegaScope, dataSource: DataSourceByJSON | DataSourceByFile) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;

    ensureDataAndSignalsArray(spec);

    spec.signals.push(dataAsSignal(dataSourceName));

    const newData: ValuesData = {
        name: dataSourceName,
        values: [],
        transform: dataSource.dataFrameTransformations || [],
    };

    if (dataSource.type === 'json') {
        newData.values = dataSource.content;
    } else if (dataSource.type === 'file') {
        newData.format = {
            type: dataSource.format
        };
        newData.values = [dataSource.content];
    }

    //real data goes to the beginning of the data array
    spec.data.unshift(newData);
}

export function addDynamicDataLoaderToSpec(vegaScope: VegaScope, dataSource: DataSourceByDynamicURL) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;

    const urlSignal = vegaScope.createUrlSignal(dataSource.url);
    const url: SignalRef = { signal: urlSignal.name };

    ensureDataAndSignalsArray(spec);

    spec.signals.push(dataAsSignal(dataSourceName));

    //real data goes to the beginning of the data array
    spec.data.unshift({
        name: dataSourceName,
        url,
        format: { type: dataSource.format || 'json' },
        transform: dataSource.dataFrameTransformations || [],
    });
}
