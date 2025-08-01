/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { TemplatedUrl } from "@microsoft/chartifact-schema";
import { TemplateToken, tokenizeTemplate } from "common";
import { Batch } from "../factory.js";

// export function getUrlSignals(url: TemplatedUrl) {
//     const signalNames = new Set<string>();

//     //get signal names from tokens in the url
//     const tokens = tokenizeTemplate(url);
//     const signalsFromToken = tokens.filter(token => token.type === 'variable').map(token => token.name);
//     signalsFromToken.forEach(token => signalNames.add(token));

//     return Array.from(signalNames);
// }

export class DynamicUrl {
    public signals: Record<string, string>;
    public tokens: TemplateToken[];
    public lastUrl: string;

    constructor(public templateUrl: TemplatedUrl, public onChange: (url: string) => void) {
        this.signals = {};
        this.tokens = tokenizeTemplate(templateUrl);
        const signalNames = this.tokens.filter(token => token.type === 'variable').map(token => token.name);
        if (signalNames.length === 0) {
            // If there are no signals, we can set the url directly
            onChange(templateUrl);
            this.lastUrl = templateUrl;
            return;
        }
        signalNames.forEach(signalName => {
            this.signals[signalName] = undefined;
        });
    }

    public makeUrl() {
        const signalNames = Object.keys(this.signals);
        if (signalNames.length === 0) {
            return this.templateUrl;
        }
        const urlParts: string[] = [];
        this.tokens.forEach(token => {
            if (token.type === 'literal') {
                urlParts.push(token.value);
            } else if (token.type === 'variable') {
                const signalValue = this.signals[token.name];
                if (signalValue !== undefined) {
                    urlParts.push(encodeURIComponent(signalValue));
                } else {
                    //leave variable slot empty
                }
            }
        });
        return urlParts.join('');
    }

    public receiveBatch(batch: Batch) {
        for (const [signalName, batchItem] of Object.entries(batch)) {
            if (signalName in this.signals) {
                if (batchItem.isData || batchItem.value === undefined) {
                    continue;
                }
                this.signals[signalName] = batchItem.value.toString();
            }
        }
        const newUrl = this.makeUrl();
        if (newUrl !== this.lastUrl) {
            this.onChange(newUrl);
            this.lastUrl = newUrl;
        }
    }

}
