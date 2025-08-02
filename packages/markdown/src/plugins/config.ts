/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { definePlugin, Plugin, RawFlaggableSpec } from "../factory.js";
import { sanitizedHTML } from "../sanitize.js";
import { PluginNames } from "./interfaces.js";
import { getJsonScriptTag } from "./util.js";
import { SpecReview } from 'common';

export function flaggableJsonPlugin<T>(pluginName: PluginNames, className: string, flagger?: (spec: T) => RawFlaggableSpec<T>, attrs?: object) {
    const plugin: Plugin<T> = {
        name: pluginName,
        initializePlugin: (md) => definePlugin(md, pluginName),
        fence: (token, index) => {
            let json = token.content.trim();
            let spec: T;
            let flaggableSpec: RawFlaggableSpec<T>;
            try {
                spec = JSON.parse(json);
            } catch (e) {
                flaggableSpec = {
                    spec: null,
                    hasFlags: true,
                    reasons: [`malformed JSON`],
                };
            }
            if (spec) {
                if (flagger) {
                    flaggableSpec = flagger(spec);
                } else {
                    flaggableSpec = { spec };
                }
            }
            if (flaggableSpec) {
                json = JSON.stringify(flaggableSpec);
            }
            return sanitizedHTML('div', { class: className, id: `${pluginName}-${index}`, ...attrs }, json, true);
        },
        hydrateSpecs: (renderer, errorHandler) => {
            const flagged: SpecReview<T>[] = [];
            const containers = renderer.element.querySelectorAll(`.${className}`);
            for (const [index, container] of Array.from(containers).entries()) {
                const flaggableSpec = getJsonScriptTag(container, e => errorHandler(e, pluginName, index, 'parse', container)) as RawFlaggableSpec<T>;
                if (!flaggableSpec) continue;
                const f: SpecReview<T> = { approvedSpec: null, pluginName, containerId: container.id };
                if (flaggableSpec.hasFlags) {
                    f.blockedSpec = flaggableSpec.spec;
                    f.reason = flaggableSpec.reasons?.join(', ') || 'Unknown reason';
                } else {
                    f.approvedSpec = flaggableSpec.spec;
                }
                flagged.push(f);
            }
            return flagged;
        },
    };
    return plugin;
}
