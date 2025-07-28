import { definePlugin, Plugin, RawFlaggableSpec } from "../factory.js";
import { sanitizedHTML } from "../sanitize.js";
import { getJsonScriptTag } from "./util.js";
import { Flagged } from 'common';

export function flaggableJsonPlugin<T>(pluginName: string, className: string, flagger?: (spec: T) => RawFlaggableSpec<T>) {
    const plugin: Plugin<T> = {
        name: pluginName,
        initializePlugin: (md) => definePlugin(md, pluginName),
        fence: (token, index) => {
            let json = token.content.trim();
            if (flagger) {
                let spec: T;
                let flaggableSpec: RawFlaggableSpec<T>;
                try {
                    spec = JSON.parse(json);
                } catch (e) {
                    flaggableSpec = {
                        spec: null,
                        hasFlags: true,
                        reason: `malformed JSON`
                    };
                }
                if (spec) {
                    flaggableSpec = flagger(spec);
                }
                if (flaggableSpec) {
                    json = JSON.stringify(flaggableSpec);
                }
            }
            return sanitizedHTML('div', { class: className, id: `${pluginName}-${index}` }, json, true);
        },
        hydrateSpecs: (renderer, errorHandler) => {
            const flagged: Flagged<T>[] = [];
            const containers = renderer.element.querySelectorAll(`.${className}`);
            for (const [index, container] of Array.from(containers).entries()) {
                const id = container.id;
                const flaggableSpec = getJsonScriptTag(container, e => errorHandler(e, pluginName, index, 'parse', container)) as RawFlaggableSpec<T>;
                if (!flaggableSpec) continue;
                const f: Flagged<T> = { approvedSpec: null, pluginName, containerId: container.id };
                if (flaggableSpec.hasFlags) {
                    f.unApprovedSpec = flaggableSpec.spec;
                    f.reason = flaggableSpec.reason;
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
