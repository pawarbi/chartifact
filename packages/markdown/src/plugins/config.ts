import { definePlugin, IConfig, IConfigContainer, Plugin } from "../factory.js";
import { ErrorHandler, Renderer } from '../renderer.js';
import { sanitizedHTML } from "../sanitize.js";
import { getJsonScriptTag } from "./util.js";

export function hydrateConfig<T>(pluginName: string, className: string, renderer: Renderer, errorHandler: ErrorHandler) {
    const configs: IConfigContainer<T>[] = [];
    const containers = renderer.element.querySelectorAll(`.${className}`);
    for (const [index, container] of Array.from(containers).entries()) {
        const jsonObj = getJsonScriptTag(container, e => errorHandler(e, pluginName, index, 'parse', container));
        if (!jsonObj) continue;
        configs.push({ container: container as HTMLElement, config: jsonObj });
    }
    return configs;
}

export function configPlugin<T>(pluginName: string, className: string, j2c?: (spec: T) => IConfig<T>) {
    const basePlugin: Plugin<T> = {
        name: pluginName,
        initializePlugin: (md) => definePlugin(md, pluginName),
        fence: token => {
            let content = token.content.trim();
            if (j2c) {
                let spec: T;
                try {
                    spec = JSON.parse(content);
                } catch (e) {
                    const result: IConfig<T> = {
                        spec: null,
                        hasFlags: true,
                        reason: `malformed JSON`
                    };
                    content = JSON.stringify(result);
                }
                if (spec) {
                    const config = j2c(spec);
                    content = JSON.stringify(config);
                }
            }
            return sanitizedHTML('div', { class: className }, content, true);
        },
        hydrateConfig: (renderer, errorHandler) => {
            return hydrateConfig<T>(pluginName, className, renderer, errorHandler);
        },
    };
    return basePlugin;
}
