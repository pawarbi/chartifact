/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Token } from 'markdown-it/index.js';
import { IInstance, Plugin, PrioritizedSignal } from '../factory.js';
import { PluginNames } from './interfaces.js';
import { DynamicUrl } from './url.js';

function decorateDynamicUrl(tokens: Token[], idx: number, attrName: string, elementType: string) {
    const token = tokens[idx];
    const attrValue = token.attrGet(attrName);
    if (attrValue && attrValue.includes('%7B%7B')) {
        if (!token.attrs) {
            token.attrs = [];
        }
        // Store original template
        token.attrSet('dynamic-url', decodeURIComponent(attrValue));

        // remove the original attribute because it's data-driven
        token.attrSet(attrName, '');
    }
    return token;
}

const pluginName: PluginNames = 'placeholders';

export const placeholdersPlugin: Plugin = {
    name: pluginName,
    initializePlugin: async (md) => {
        // Custom plugin to handle dynamic placeholders
        md.use(function (md) {
            // Add a custom rule to handle {{...}} placeholders
            md.inline.ruler.after('emphasis', 'dynamic_placeholder', function (state, silent) {
                let token: Token;
                const max = state.posMax;
                const start = state.pos;

                // Look for double curly braces {{
                if (state.src.charCodeAt(start) !== 0x7B /* { */ ||
                    state.src.charCodeAt(start + 1) !== 0x7B /* { */) {
                    return false;
                }

                for (let pos = start + 2; pos < max; pos++) {
                    if (state.src.charCodeAt(pos) === 0x7D /* } */ &&
                        state.src.charCodeAt(pos + 1) === 0x7D /* } */) {
                        if (!silent) {
                            state.pos = start + 2;
                            state.posMax = pos;

                            token = state.push('dynamic_placeholder', '', 0);
                            token.markup = state.src.slice(start, pos + 2);
                            token.content = state.src.slice(state.pos, state.posMax);

                            state.pos = pos + 2;
                            state.posMax = max;
                        }
                        return true;
                    }
                }
                return false;
            });

            // Renderer rule for dynamic placeholders
            md.renderer.rules['dynamic_placeholder'] = function (tokens, idx) {
                const key = tokens[idx].content.trim();
                return `<span class="dynamic-placeholder" data-key="${key}">{${key}}</span>`;
            };
        });

        md.renderer.rules['link_open'] = function (tokens, idx, options, env, slf) {
            decorateDynamicUrl(tokens, idx, 'href', 'link');
            return slf.renderToken(tokens, idx, options);
        };

        md.renderer.rules['image'] = function (tokens, idx, options, env, slf) {
            decorateDynamicUrl(tokens, idx, 'src', 'image');
            return slf.renderToken(tokens, idx, options);
        };

    },

    hydrateComponent: async (renderer) => {
        const dynamicUrlMap = new WeakMap<Element, DynamicUrl>();
        const placeholders = renderer.element.querySelectorAll('.dynamic-placeholder');
        const dynamicUrls = renderer.element.querySelectorAll('[dynamic-url]');
        const elementsByKeys = new Map<string, Element[]>();

        // Collect placeholders
        for (const placeholder of Array.from(placeholders)) {
            const key = placeholder.getAttribute('data-key');
            if (!key) {
                continue;
            }
            if (elementsByKeys.has(key)) {
                elementsByKeys.get(key)!.push(placeholder);
            } else {
                elementsByKeys.set(key, [placeholder]);
            }
        }

        // Collect dynamic URLs
        for (const element of Array.from(dynamicUrls)) {
            const templateUrl = element.getAttribute('dynamic-url');
            if (!templateUrl) {
                continue;
            }

            const dynamicUrl = new DynamicUrl(templateUrl, (url) => {
                if (element.tagName === 'A') {
                    element.setAttribute('href', url);
                } else if (element.tagName === 'IMG') {
                    element.setAttribute('src', url);
                }
            });

            const variableNames: string[] = dynamicUrl.tokens
                .filter(token => token.type === 'variable')
                .map(token => token.name);

            dynamicUrlMap.set(element, dynamicUrl);

            for (const key of variableNames) {
                if (elementsByKeys.has(key)) {
                    elementsByKeys.get(key)!.push(element);
                } else {
                    elementsByKeys.set(key, [element]);
                }
            }
        }

        // Create initial signals
        const initialSignals = Array.from(elementsByKeys.keys()).map(name => {
            const prioritizedSignal: PrioritizedSignal = {
                name,
                value: null,
                priority: -1,
                isData: false,
            };
            return prioritizedSignal;
        });

        const instances: IInstance[] = [
            {
                id: pluginName,
                initialSignals,
                receiveBatch: async (batch) => {
                    for (const key of Object.keys(batch)) {
                        const elements = elementsByKeys.get(key) || [];
                        for (const element of elements) {
                            if (element.classList.contains('dynamic-placeholder')) {
                                // Update placeholder content
                                const markdownContent = batch[key].value?.toString() || '';
                                const parsedMarkdown = isMarkdownInline(markdownContent)
                                    ? renderer.md.renderInline(markdownContent)
                                    : renderer.md.render(markdownContent);
                                element.innerHTML = parsedMarkdown;
                            } else if (element.hasAttribute('dynamic-url')) {
                                // Update dynamic URL
                                const dynamicUrl = dynamicUrlMap.get(element);
                                if (dynamicUrl) {
                                    dynamicUrl.receiveBatch(batch);
                                }
                            }
                        }
                    }
                },
            },
        ];

        return instances;
    },
};

function isMarkdownInline(markdown: string) {
    // Inline markdown typically does not contain newlines
    if (!markdown.includes('\n')) {
        return true;
    }

    // Block markdown typically contains newlines and block elements
    const blockElements = ['#', '-', '*', '>', '```', '~~~'];
    for (const element of blockElements) {
        if (markdown.trim().startsWith(element)) {
            return false;
        }
    }

    return true;
}