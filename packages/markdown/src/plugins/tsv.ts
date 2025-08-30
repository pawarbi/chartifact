/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { DsvSpec, dsvPlugin } from './dsv.js';
import { Plugin } from '../factory.js';

export interface TsvSpec extends DsvSpec {}

// TSV plugin delegates to DSV with tab delimiter for backwards compatibility
export const tsvPlugin: Plugin<TsvSpec> = {
    name: 'tsv',
    fence: (token, index) => {
        const info = token.info.trim();
        const parts = info.split(/\s+/);
        
        // Extract variableId from "tsv variableId" or default
        let variableId = parts.length >= 2 ? parts[1] : `tsvData${index}`;
        
        // Create DSV fence info with tab delimiter
        const dsvInfo = `dsv delimiter:\t variableId:${variableId}`;
        
        // Create a modified token with DSV info
        const dsvToken = Object.assign({}, token, { info: dsvInfo });
        
        return dsvPlugin.fence!(dsvToken, index);
    },
    hydrateSpecs: dsvPlugin.hydrateSpecs,
    hydrateComponent: dsvPlugin.hydrateComponent,
};
