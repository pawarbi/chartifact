/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { DataSourceByDynamicURL, DataSourceByFile, DataSourceInline } from '@microsoft/chartifact-schema';
import { read, SignalRef, ValuesData } from 'vega';
import { VegaScope } from './scope.js';
import { dataAsSignal, ensureDataAndSignalsArray } from './spec.js';
import { tokenizeTemplate } from 'common';

export function addStaticDataLoaderToSpec(vegaScope: VegaScope, dataSource: DataSourceInline | DataSourceByFile) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;

    ensureDataAndSignalsArray(spec);

    spec.signals.push(dataAsSignal(dataSourceName));

    const newData: ValuesData = {
        name: dataSourceName,
        values: [],
        transform: dataSource.dataFrameTransformations || [],
    };

    if (dataSource.type === 'inline') {

        if (dataSource.format === 'json') {
            newData.values = dataSource.content as object[];
        } else if (typeof dataSource.content === 'string') {

            //csv / tsv
            const data = read(dataSource.content, {
                type: dataSource.format,
            });

            if (Array.isArray(data)) {
                newData.values = data;
            } else {
                console.warn(`Unsupported inline data format: ${dataSource.format}, type is ${typeof dataSource.content}`);
            }

        } else {
            console.warn(`Unsupported inline data format: ${dataSource.format}, type is ${typeof dataSource.content}`);
        }

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

    //look for signal token within the dataSource.url
    const tokens = tokenizeTemplate(dataSource.url);
    const variableCount = tokens.filter(token => token.type === 'variable').length;

    let url: string | SignalRef;

    if (variableCount) {
        const urlSignal = vegaScope.createUrlSignal(dataSource.url, tokens);
        url = { signal: urlSignal.name };

    } else {
        //dont need an extra signal, just load url directly
        url = dataSource.url;
    }

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
