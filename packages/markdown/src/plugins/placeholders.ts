/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Token } from 'markdown-it/index.js';
import { IInstance, Plugin, PrioritizedSignal } from '../factory.js';
import { PluginNames } from './interfaces.js';
import { DynamicUrl } from './url.js';
import { createImageContainerTemplate, createImageLoadingLogic } from './image.js';
import { pluginClassName } from './util.js';
import { sanitizeHtmlComment } from '../sanitize.js';
import { tokenizeTemplate } from 'common';

export function decorateDynamicUrl(tokens: Token[], idx: number, attrName: string, elementType: string) {
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

export function decorateFenceWithPlaceholders(tokens: Token[], idx: number): string {
    const token = tokens[idx];
    const content = token.content;
    
    // Check if content has placeholders
    if (content && content.includes('{{')) {
        // Use tokenizeTemplate to extract placeholders (like decorateDynamicUrl does)
        const templateTokens = tokenizeTemplate(content);
        const variableTokens = templateTokens.filter(t => t.type === 'variable');
        
        if (variableTokens.length > 0) {
            // Store the original template content (like dynamic-url attribute)
            const templateContent = encodeURIComponent(content);
            
            // Create HTML with the template stored in data attribute
            const placeholderData = variableTokens.map(t => `data-placeholder-${t.name.toLowerCase()}="true"`).join(' ');
            
            return `<pre class="has-placeholders" data-template-content="${templateContent}" ${placeholderData}><code></code></pre>`;
        }
    }
    
    return null;
}

const pluginName: PluginNames = 'placeholders';
const imageClassName = pluginClassName(pluginName + '_image');

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
            const alt = tokens[idx].attrGet('alt');
            const src = tokens[idx].attrGet('src');
            let error: string;
            const html = createImageContainerTemplate(imageClassName, alt, decodeURIComponent(src), idx, (e, pluginName, instanceIndex, phase, container, detail) => {
                error = sanitizeHtmlComment(`Error in plugin ${pluginName} instance ${instanceIndex} phase ${phase}: ${e.message} ${detail}`);
            });
            return error || html;
        };

    },

    hydrateComponent: async (renderer, errorHandler) => {
        const dynamicUrlMap = new WeakMap<Element, DynamicUrl>();
        const templateHandlerMap = new WeakMap<Element, any>();
        const placeholders = renderer.element.querySelectorAll('.dynamic-placeholder');
        const dynamicUrls = renderer.element.querySelectorAll('[dynamic-url]');
        const dynamicImages = renderer.element.querySelectorAll(`.${imageClassName}`);
        const codeBlocksWithPlaceholders = renderer.element.querySelectorAll('.has-placeholders[data-template-content]');

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

        // Collect code blocks with placeholders (like dynamic URLs)
        for (const element of Array.from(codeBlocksWithPlaceholders)) {
            const templateContent = element.getAttribute('data-template-content');
            if (!templateContent) {
                continue;
            }

            // Create a custom template handler that doesn't URL encode (unlike DynamicUrl)
            const templateText = decodeURIComponent(templateContent);
            const tokens = tokenizeTemplate(templateText);
            const variableTokens = tokens.filter(token => token.type === 'variable');
            
            // Create a simple object to track signal values for this template
            const templateHandler = {
                signals: {} as Record<string, string>,
                update: () => {
                    let content = '';
                    for (const token of tokens) {
                        if (token.type === 'literal') {
                            content += token.value;
                        } else if (token.type === 'variable') {
                            content += templateHandler.signals[token.name] || '';
                        }
                    }
                    element.innerHTML = `<code>${content}</code>`;
                }
            };

            // Initialize signal values
            variableTokens.forEach(token => {
                templateHandler.signals[token.name] = '';
            });

            // Store the template handler instead of DynamicUrl
            templateHandlerMap.set(element, templateHandler);

            // Register for signal updates
            variableTokens.forEach(token => {
                const key = token.name;
                if (elementsByKeys.has(key)) {
                    elementsByKeys.get(key)!.push(element);
                } else {
                    elementsByKeys.set(key, [element]);
                }
            });
        }

        // Collect dynamic URLs
        for (const element of Array.from(dynamicUrls)) {
            const templateUrl = element.getAttribute('dynamic-url');
            if (!templateUrl) {
                continue;
            }

            if (element.tagName === 'A') {

                const dynamicUrl = new DynamicUrl(templateUrl, (url) => {
                    element.setAttribute('href', url);
                });

                dynamicUrlMap.set(element, dynamicUrl);

                for (const key of Object.keys(dynamicUrl.signals)) {
                    if (elementsByKeys.has(key)) {
                        elementsByKeys.get(key)!.push(element);
                    } else {
                        elementsByKeys.set(key, [element]);
                    }
                }
            }
        }

        // Collect dynamic images
        for (const element of Array.from(dynamicImages)) {
            const { dynamicUrl, img } = createImageLoadingLogic(element as HTMLElement, null, (error) => {
                const index = -1; // TODO get index of image
                errorHandler(error, pluginName, index, 'load', element, img.src);
            });

            if (!dynamicUrl) {
                continue;
            }

            dynamicUrlMap.set(element, dynamicUrl);

            for (const key of Object.keys(dynamicUrl.signals)) {
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
                            } else if (element.classList.contains(imageClassName)) {
                                // Update dynamic image URL
                                const dynamicUrl = dynamicUrlMap.get(element);
                                if (dynamicUrl) {
                                    dynamicUrl.receiveBatch(batch);
                                }
                            } else if (element.hasAttribute('data-template-content')) {
                                const templateHandler = templateHandlerMap.get(element);
                                if (templateHandler && templateHandler.signals) {
                                    templateHandler.signals[key] = batch[key].value?.toString() || '';
                                    templateHandler.update();
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