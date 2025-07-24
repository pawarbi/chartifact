/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { definePlugin, IInstance, Plugin } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';

// CSS Tree is expected to be available as a global variable
declare const csstree: any;

interface Rule {
    css: string;
    flag?: "xss" | "scriptExec" | "externalResource" | "malformed";
    reason?: string;
}

interface CategorizedCss {
    safeAtRules?: { [atRuleSignature: string]: Rule[] }; // Optional - might be empty if all rules are unsafe
    flaggedAtRules?: { [atRuleSignature: string]: Rule[] }; // External resources needing approval
    unsafeAtRules?: { [atRuleSignature: string]: Rule[] }; // Definitively blocked content
}

// Helper function to reconstitute an at-rule block from signature and rules
function reconstituteAtRule(signature: string, rules: Rule[], onlyUnflagged: boolean = true): string {
    const validRules = onlyUnflagged ? rules.filter(rule => !rule.flag) : rules;
    if (validRules.length === 0) return '';

    if (signature === '') {
        // Standalone rules (no at-rule wrapper)
        return validRules.map(rule => rule.css).join('\n');
    } else {
        // At-rule with contained rules
        const containedRules = validRules.map(rule => rule.css).join('\n');
        return `${signature} {\n${containedRules}\n}`;
    }
}

// Helper function to reconstitute complete CSS from categorized rules
function reconstituteCss(atRules: { [atRuleSignature: string]: Rule[] }, onlyUnflagged: boolean = true): string {
    const cssBlocks: string[] = [];

    for (const [signature, rules] of Object.entries(atRules)) {
        const reconstructed = reconstituteAtRule(signature, rules, onlyUnflagged);
        if (reconstructed) {
            cssBlocks.push(reconstructed);
        }
    }

    return cssBlocks.join('\n\n');
}

function categorizeCss(cssContent: string): CategorizedCss {
    const result: CategorizedCss = {};

    // Helper function to check for security issues
    function checkSecurityIssues(ruleContent: string): Pick<Rule, 'flag' | 'reason'> | null {
        if (ruleContent.toLowerCase().includes('expression(')) {
            return { flag: 'scriptExec', reason: 'CSS expression() function detected' };
        } else if (ruleContent.toLowerCase().includes('javascript:')) {
            return { flag: 'scriptExec', reason: 'JavaScript URL detected' };
        } else if (ruleContent.includes('http://') || ruleContent.includes('https://')) {
            return { flag: 'externalResource', reason: 'External URL detected' };
        }
        return null;
    }

    // Helper function to add a rule to the appropriate collections
    function addRule(signature: string, rule: Rule) {
        // Add to safeAtRules
        if (!result.safeAtRules) {
            result.safeAtRules = {};
        }
        if (!result.safeAtRules[signature]) {
            result.safeAtRules[signature] = [];
        }
        result.safeAtRules[signature].push(rule);

        // Add to appropriate flagged/unsafe collection based on flag type
        if (rule.flag) {
            if (rule.flag === 'externalResource') {
                // External resources need whitelist approval
                if (!result.flaggedAtRules) {
                    result.flaggedAtRules = {};
                }
                if (!result.flaggedAtRules[signature]) {
                    result.flaggedAtRules[signature] = [];
                }
                result.flaggedAtRules[signature].push(rule);
            } else {
                // scriptExec, xss, malformed are unsafe
                if (!result.unsafeAtRules) {
                    result.unsafeAtRules = {};
                }
                if (!result.unsafeAtRules[signature]) {
                    result.unsafeAtRules[signature] = [];
                }
                result.unsafeAtRules[signature].push(rule);
            }
        }
    }

    try {
        // Parse CSS with CSS Tree
        const ast = csstree.parse(cssContent);        // Walk through the AST and organize rules
        csstree.walk(ast, function(node) {
            if (node.type === 'Atrule') {
                const atRuleSignature = `@${node.name}${node.prelude ? ` ${csstree.generate(node.prelude)}` : ''}`;
                const ruleContent = csstree.generate(node);
                const rule: Rule = { css: ruleContent };

                const securityCheck = checkSecurityIssues(ruleContent);
                if (securityCheck) {
                    rule.flag = securityCheck.flag;
                    rule.reason = securityCheck.reason;
                }

                addRule(atRuleSignature, rule);

            } else if (node.type === 'Rule') {
                const ruleContent = csstree.generate(node);
                const rule: Rule = { css: ruleContent };

                const securityCheck = checkSecurityIssues(ruleContent);
                if (securityCheck) {
                    rule.flag = securityCheck.flag;
                    rule.reason = securityCheck.reason;
                }

                addRule('', rule); // Empty string for standalone rules
            }
        });

        // Return the categorized result - hydration will decide what to apply

    } catch (parseError) {
        result.unsafeAtRules = {
            '': [{ css: cssContent, flag: 'malformed', reason: `CSS parsing failed: ${parseError.message}` }]
        };
    }

    return result;
}

export const cssPlugin: Plugin = {
    name: 'css',
    initializePlugin: (md) => {
        // Check for required css-tree dependency
        if (typeof csstree === 'undefined') {
            throw new Error('css-tree library is required for CSS plugin. Please include the css-tree script.');
        }

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
                const cssContent = token.content.trim();

                // Parse and categorize CSS content
                const categorizedCss = categorizeCss(cssContent);

                return sanitizedHTML('div', { id: cssId, class: 'css-component' }, JSON.stringify(categorizedCss));
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
                const categorizedCss: CategorizedCss = JSON.parse(container.textContent);

                // Handle CSS with issues - show appropriate message
                if (categorizedCss.unsafeAtRules) {
                    container.innerHTML = `<div class="error">CSS blocked due to security issues</div>`;
                    continue;
                }

                if (categorizedCss.flaggedAtRules) {
                    container.innerHTML = `<div class="warning">CSS contains external URLs requiring approval</div>`;
                    continue;
                }

                // Generate and apply safe CSS from unflagged rules
                let safeCss = '';
                if (categorizedCss.safeAtRules) {
                    safeCss = reconstituteCss(categorizedCss.safeAtRules, true);
                }

                if (safeCss.trim().length > 0) {
                    const styleElement = document.createElement('style');
                    styleElement.type = 'text/css';
                    styleElement.id = `idocs-css-${container.id}`;
                    styleElement.textContent = safeCss;

                    renderer.element.appendChild(styleElement);
                    container.innerHTML = `<!-- CSS styles applied to document -->`;

                    cssInstances.push({
                        id: container.id,
                        element: styleElement
                    });
                }
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
                destroy: () => {
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
