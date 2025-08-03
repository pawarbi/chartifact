/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Spec as VegaSpec } from 'vega-typings';
import { TemplatedUrl } from '@microsoft/chartifact-schema';
import { NewSignal } from "vega";
import { safeVariableName } from "./util.js";
import { renderVegaExpression, TemplateToken } from 'common';

export class VegaScope {
    private urlCount = 0;

    constructor(public spec: VegaSpec) { }

    createUrlSignal(url: TemplatedUrl, tokens: TemplateToken[]) {
        const name = `url:${this.urlCount++}:${safeVariableName(url)}`;
        const signal: NewSignal = { name };

        // Build a string expression for urlPath, replacing variables with encodeURIComponent
        signal.update = renderVegaExpression(tokens);

        if (!this.spec.signals) {
            this.spec.signals = [];
        }
        this.spec.signals.push(signal);
        return signal;
    }
}
