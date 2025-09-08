/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { IInstance, Plugin, RawFlaggableSpec, csstree } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';
import { pluginClassName } from './util.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

interface Declaration {
    css: string;        // Safe CSS
    unsafeCss?: string; // Original unsafe CSS content (for debugging)
    flag?: 'xss' | 'scriptExec' | 'insecureExternalResource' | 'externalResource' | 'malformed' | 'importRule' | 'svgDataUrl';
    reason?: string;
}

interface Rule {
    selector: string;        // e.g., "body", ".class"
    declarations: Declaration[];
}

interface AtRule {
    signature: string;       // e.g., "@media screen", "@keyframes", "" for global
    rules?: Rule[];         // For at-rules that contain rules
    css?: string;           // For simple at-rules that don't contain rules  
    flag?: "xss" | "scriptExec" | "externalResource" | "malformed" | "importRule" | "svgDataUrl";
    reason?: string;
}

interface CategorizedCss {
    atRules: { [atRuleSignature: string]: AtRule };
}

// Helper function to reconstitute an at-rule block from at-rule data
function reconstituteAtRule(atRule: AtRule): string {
    if (atRule.css) {
        // Simple at-rule (like @import) or complete at-rule (like @keyframes) - check if it's flagged
        return atRule.flag ? `/* ${atRule.css} - BLOCKED: ${atRule.reason} */` : atRule.css;
    }

    if (!atRule.rules || atRule.rules.length === 0) return '';

    // At-rule with contained rules - reconstitute each rule
    const reconstitutedRules: string[] = [];

    for (const rule of atRule.rules) {
        const validDeclarations = rule.declarations
            .map(decl => decl.css)
            .filter(css => css.trim() !== '');

        if (validDeclarations.length > 0) {
            reconstitutedRules.push(`${rule.selector} {\n  ${validDeclarations.join(';\n  ')};\n}`);
        }
    }

    if (reconstitutedRules.length === 0) return '';

    if (atRule.signature === '') {
        // Global rules (no at-rule wrapper)
        return reconstitutedRules.join('\n\n');
    } else {
        // At-rule with contained rules
        return `${atRule.signature} {\n${reconstitutedRules.join('\n\n')}\n}`;
    }
}

// Helper function to reconstitute complete CSS from categorized rules
function reconstituteCss(atRules: { [atRuleSignature: string]: AtRule }): string {
    const cssBlocks: string[] = [];

    for (const atRule of Object.keys(atRules).map(key => atRules[key])) {
        const reconstructed = reconstituteAtRule(atRule);
        if (reconstructed.trim()) {
            cssBlocks.push(reconstructed);
        }
    }

    return cssBlocks.join('\n\n');
}

function categorizeCss(cssContent: string) {
    const spec: CategorizedCss = {
        atRules: {},
    };

    const result: RawFlaggableSpec<CategorizedCss> = {
        spec,
        hasFlags: false,
        reasons: [],
    };

    // At-rules that should be treated as complete blocks (not parsed internally)
    const completeBlockAtRules = [
        // Keyframes and variants
        'keyframes',
        '-webkit-keyframes',
        '-moz-keyframes',
        '-o-keyframes',
        // Font-related at-rules
        'font-face',
        'font-feature-values',
        'font-palette-values',
        // Page and counter styling
        'page',
        'counter-style',
        // CSS Houdini and newer features
        'property',
        'layer',
        'container',
        'scope',
        'starting-style',
        'position-try'
    ];

    // Helper function to find the at-rule context for a given node
    const findAtRuleContext = (targetNode: any, rootNode: any): string => {
        let context = ''; // Default to global context
        
        // Walk through the AST to find the parent at-rule that contains our target node
        csstree.walk(rootNode, (node, item, list) => {
            if (node.type === 'Atrule' && node.block) {
                const atRuleSignature = `@${node.name}${node.prelude ? ` ${csstree.generate(node.prelude)}` : ''}`;
                
                // Check if our target node is inside this at-rule's block
                let foundTarget = false;
                csstree.walk(node.block, (innerNode) => {
                    if (innerNode === targetNode) {
                        foundTarget = true;
                    }
                });
                
                if (foundTarget) {
                    context = atRuleSignature;
                }
            }
        });
        
        return context;
    };

    // Helper function to add a rule to the correct at-rule context
    const addRuleToContext = (rule: Rule, context: string) => {
        if (!spec.atRules[context]) {
            spec.atRules[context] = {
                signature: context,
                rules: []
            };
        }

        if (spec.atRules[context].rules) {
            spec.atRules[context].rules.push(rule);
        } else {
            spec.atRules[context].rules = [rule];
        }
    };

    // Helper function to check for security issues using AST node analysis
    const checkSecurityIssues = (node: any): Pick<Declaration, 'flag' | 'reason'> | null => {
        // Check for script execution in CSS expressions
        if (node.type === 'Function' && node.name === 'expression') {
            return { flag: 'scriptExec', reason: 'CSS expression() function detected' };
        }

        // Check URLs for security issues
        if (node.type === 'Url') {
            const urlValue = node.value;
            if (!urlValue) return null;

            const url = urlValue.value || urlValue;
            const urlStr = url.toLowerCase();

            // Script URLs
            if (urlStr.startsWith('javascript:') || urlStr.startsWith('vbscript:')) {
                return { flag: 'scriptExec', reason: `${urlStr.split(':')[0]} URL detected` };
            }

            // Data URLs need specific checking
            if (urlStr.startsWith('data:')) {
                // SVG data URLs can contain scripts
                if (urlStr.indexOf('data:image/svg+xml') !== -1) {
                    if (urlStr.indexOf('<script') !== -1) {
                        return { flag: 'svgDataUrl', reason: 'SVG data URL with script detected' };
                    }
                    //TODO check for inline handlers
                    //for now, disallow svg data URLs
                    return { flag: 'svgDataUrl', reason: 'SVG data URL detected - requires approval' };
                }
                // Other data URLs might be safe, but let's flag for review
                return { flag: 'externalResource', reason: 'Data URL detected' };
            }

            // External HTTP/HTTPS URLs
            if (urlStr.startsWith('http://')) {
                return { flag: 'insecureExternalResource', reason: 'Insecure external URL (http) detected' };
            } else if (urlStr.startsWith('https://')) {
                return { flag: 'externalResource', reason: 'External URL detected' };
            }
        }

        // Check for CSS-encoded XSS attempts in values
        if (node.type === 'String' || node.type === 'Identifier') {
            const value = node.value || node.name || '';
            if (typeof value === 'string') {
                const valueStr = value.toLowerCase();
                // Check for CSS-encoded characters that could be XSS
                if (valueStr.indexOf('\\') !== -1 && (valueStr.indexOf('3c') !== -1 || valueStr.indexOf('3e') !== -1 || valueStr.indexOf('22') !== -1 || valueStr.indexOf('27') !== -1)) {
                    return { flag: 'xss', reason: 'Potential CSS-encoded XSS detected' };
                }
            }
        }

        return null;
    };

    try {
        // Parse CSS with CSS Tree
        const ast = csstree.parse(cssContent);

        // Track rules and their declarations as we build them
        const pendingRules: { rule: Rule; context: string; node: any }[] = [];

        // First pass: collect all at-rules and rules
        csstree.walk(ast, (node) => {
            if (node.type === 'Atrule') {
                const atRuleSignature = `@${node.name}${node.prelude ? ` ${csstree.generate(node.prelude)}` : ''}`;

                // Check for @import specifically
                if (node.name === 'import') {
                    const ruleContent = csstree.generate(node);
                    const reason = '@import rule detected - requires approval';
                    spec.atRules[atRuleSignature] = {
                        signature: atRuleSignature,
                        css: ruleContent,
                        flag: 'importRule',
                        reason,
                    };
                    result.hasFlags = true;
                    result.reasons.push(reason);
                    return;
                }

                // For at-rules that should be treated as complete blocks
                if (completeBlockAtRules.indexOf(node.name) !== -1) {
                    // Store the entire rule as CSS and validate it as a complete block
                    const ruleContent = csstree.generate(node);
                    spec.atRules[atRuleSignature] = {
                        signature: atRuleSignature,
                        css: ruleContent
                    };
                    return;
                }

                // For other at-rules that contain rules (like @media, @supports)
                if (node.block) {
                    // Initialize the at-rule container if it doesn't exist
                    if (!spec.atRules[atRuleSignature]) {
                        spec.atRules[atRuleSignature] = {
                            signature: atRuleSignature,
                            rules: []
                        };
                    }
                } else {
                    // Simple at-rule without block
                    const ruleContent = csstree.generate(node);
                    spec.atRules[atRuleSignature] = {
                        signature: atRuleSignature,
                        css: ruleContent
                    };
                }

            } else if (node.type === 'Rule') {
                // Determine the correct context for this rule
                const context = findAtRuleContext(node, ast);
                
                // Start building the rule
                const selector = csstree.generate(node.prelude);
                const rule: Rule = {
                    selector,
                    declarations: []
                };
                
                // Store the rule with its context for later processing
                pendingRules.push({ rule, context, node });
            }
        });

        // Second pass: process declarations for each rule
        for (const { rule, context, node } of pendingRules) {
            csstree.walk(node, (declNode) => {
                if (declNode.type === 'Declaration') {
                    // Process declaration within the current rule
                    const declCss = csstree.generate(declNode);
                    const declaration: Declaration = { css: declCss };

                    // Check this declaration node directly for security issues
                    const securityCheck = checkSecurityIssues(declNode);
                    if (securityCheck) {
                        declaration.css = `/* omitted (${securityCheck.reason}) */`;
                        declaration.unsafeCss = declCss;
                        declaration.flag = securityCheck.flag;
                        declaration.reason = securityCheck.reason;
                        result.hasFlags = true;
                        result.reasons.push(securityCheck.reason);
                    } else {
                        // Check child nodes of the declaration for security issues
                        csstree.walk(declNode, (childNode) => {
                            if (childNode !== declNode && 
                                (childNode.type === 'Function' || childNode.type === 'Url' ||
                                 childNode.type === 'String' || childNode.type === 'Identifier')) {
                                const childSecurityCheck = checkSecurityIssues(childNode);
                                if (childSecurityCheck && !declaration.flag) {
                                    declaration.unsafeCss = declaration.css;
                                    declaration.css = `/* omitted (${childSecurityCheck.reason}) */`;
                                    declaration.flag = childSecurityCheck.flag;
                                    declaration.reason = childSecurityCheck.reason;
                                    result.hasFlags = true;
                                    result.reasons.push(childSecurityCheck.reason);
                                }
                            }
                        });
                    }

                    rule.declarations.push(declaration);
                }
            });
            
            // Add the completed rule to the correct context
            if (rule.declarations.length > 0) {
                addRuleToContext(rule, context);
            }
        }

    } catch (parseError) {
        // Don't swallow CSS parsing errors - throw them so they can be handled upstream
        throw new Error(`CSS parsing failed: ${parseError.message}`);
    }

    return result;
}

const pluginName: PluginNames = 'css';
const className = pluginClassName(pluginName);

export const cssPlugin: Plugin<CategorizedCss> = {
    ...flaggablePlugin<CategorizedCss>(pluginName, className),
    fence: (token, index) => {
        const cssContent = token.content.trim();
        // Parse and categorize CSS content
        const categorizedCss = categorizeCss(cssContent);
        return sanitizedHTML('div', { id: `${pluginName}-${index}`, class: className }, JSON.stringify(categorizedCss), true);
    },
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const cssInstances: { id: string; element: HTMLStyleElement }[] = [];

        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            const categorizedCss = specReview.approvedSpec;
            const comments: string[] = [];

            // Generate and apply safe CSS
            const safeCss = reconstituteCss(categorizedCss.atRules);

            if (safeCss.trim().length > 0) {
                const styleElement = document.createElement('style');
                styleElement.type = 'text/css';
                styleElement.id = `chartifact-css-${index}`;
                styleElement.textContent = safeCss;

                // Apply to shadow DOM if available, otherwise document
                const target = renderer.shadowRoot || document.head;
                target.appendChild(styleElement);

                comments.push(`<!-- CSS styles applied to ${renderer.shadowRoot ? 'shadow DOM' : 'document'} -->`);

                cssInstances.push({
                    id: `${pluginName}-${index}`,
                    element: styleElement
                });
            } else {
                comments.push(`<!-- No safe CSS styles to apply -->`);
            }

            container.innerHTML = comments.join('\n');
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
