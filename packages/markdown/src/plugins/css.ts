/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { definePlugin, IInstance, Plugin } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';

export const cssPlugin: Plugin = {
    name: 'css',
    initializePlugin: (md) => {
        definePlugin(md, 'css');
        // Custom rule for CSS blocks
        md.block.ruler.before('fence', 'css_block', function (state, startLine, endLine) {
            const start = state.bMarks[startLine] + state.tShift[startLine];
            const max = state.eMarks[startLine];

            // Check if the block starts with "```css"
            if (!state.src.slice(start, max).trim().startsWith('```css')) {
                return false;
            }

            let nextLine = startLine;
            while (nextLine < endLine) {
                nextLine++;
                if (state.src.slice(state.bMarks[nextLine] + state.tShift[nextLine], state.eMarks[nextLine]).trim() === '```') {
                    break;
                }
            }

            state.line = nextLine + 1;
            const token = state.push('fence', 'code', 0);
            token.info = 'css';
            token.content = state.getLines(startLine + 1, nextLine, state.blkIndent, true);
            token.map = [startLine, state.line];

            return true;
        });

        // Custom renderer for CSS fence blocks
        const originalFence = md.renderer.rules.fence;
        md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
            const token = tokens[idx];
            const info = token.info.trim();

            if (info === 'css') {
                const cssId = `css-${idx}`;
                return sanitizedHTML('div', { id: cssId, class: 'css-component' }, token.content.trim());
            }

            // Fallback to original fence renderer
            if (originalFence) {
                return originalFence(tokens, idx, options, env, slf);
            } else {
                return '';
            }
        };
    },
    hydrateComponent: async (renderer, errorHandler) => {
        const cssInstances: { id: string; element: HTMLStyleElement }[] = [];
        const containers = renderer.element.querySelectorAll('.css-component');
        
        for (const [index, container] of Array.from(containers).entries()) {
            if (!container.textContent) continue;

            try {
                const cssContent = container.textContent.trim();
                
                // Note: CSS sanitization is handled by DOMPurify at the renderer level
                
                // Create a style element with a unique ID
                const styleElement = document.createElement('style');
                styleElement.type = 'text/css';
                styleElement.id = `idocs-css-${container.id}`;
                styleElement.textContent = cssContent;
                
                // Add the style element to the renderer element
                renderer.element.appendChild(styleElement);
                
                // Clear the container and add a comment indicating CSS was applied
                container.innerHTML = `<!-- CSS styles applied to document -->`;
                
                cssInstances.push({
                    id: container.id,
                    element: styleElement
                });
            } catch (e) {
                container.innerHTML = `<div class="error">${e.toString()}</div>`;
                errorHandler(e, 'CSS', index, 'parse', container);
                continue;
            }
        }

        const instances: IInstance[] = cssInstances.map((cssInstance) => {
            return {
                id: cssInstance.id,
                initialSignals: [], // CSS doesn't need signals
                destroy: async () => {
                    // Remove the style element when the instance is destroyed
                    if (cssInstance.element && cssInstance.element.parentNode) {
                        cssInstance.element.parentNode.removeChild(cssInstance.element);
                    }
                },
            };
        });

        return instances;
    },
};

/**
 * CSS Plugin - Simple CSS injection for styling
 * 
 * Usage:
 * ```css
 * .my-class {
 *     color: red;
 *     font-size: 16px;
 * }
 * ```
 * 
 * Security Note:
 * - CSS content is sanitized by DOMPurify at the renderer level
 * - This plugin focuses on CSS application, not sanitization
 */
