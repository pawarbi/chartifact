import { Spec as VegaSpec } from 'vega-typings';
import { MappedNameValuePairs, UrlRef } from "schema";
import { NewSignal } from "vega";
import { safeVariableName } from "./util.js";

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

function variableValueExpression(param: MappedNameValuePairs) {
    if (param.variableId) {
        return param.variableId;
    } else if (param.calculation) {
        return '(' + param.calculation.vegaExpression + ')';
    } else {
        return JSON.stringify(param.value);
    }
}
