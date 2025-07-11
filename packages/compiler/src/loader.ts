import { DataSourceByDynamicURL, DataSourceByFile, DataSourceByJSON } from 'schema';
import { SignalRef, ValuesData } from 'vega';
import { VegaScope } from './scope.js';

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
