import { definePlugin, FlaggableSpec, SpecContainer, Plugin } from "../factory.js";
import { sanitizedHTML } from "../sanitize.js";
import { getJsonScriptTag } from "./util.js";

export function flaggableJsonPlugin<T>(pluginName: string, className: string, flagger?: (spec: T) => FlaggableSpec<T>) {
    const plugin: Plugin<T> = {
        name: pluginName,
        initializePlugin: (md) => definePlugin(md, pluginName),
        fence: token => {
            let json = token.content.trim();
            if (flagger) {
                let spec: T;
                let flaggableSpec: FlaggableSpec<T>;
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
            return sanitizedHTML('div', { class: className }, json, true);
        },
        hydrateSpecs: (renderer, errorHandler) => {
            const specContainers: SpecContainer<T>[] = [];
            const containers = renderer.element.querySelectorAll(`.${className}`);
            for (const [index, container] of Array.from(containers).entries()) {
                const flaggableSpec = getJsonScriptTag(container, e => errorHandler(e, pluginName, index, 'parse', container));
                if (!flaggableSpec) continue;
                specContainers.push({ container: container as HTMLElement, flaggableSpec });
            }
            return specContainers;
        },
    };
    return plugin;
}
