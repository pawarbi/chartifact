/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

export type TemplateToken =
    | { type: 'literal'; value: string }
    | { type: 'variable'; name: string };

/**
 * Tokenizes a template string into an array of tokens.
 * @param input - The input string containing template variables in the format {{variableName}}.
 * @returns An array of template tokens.
 */
export function tokenizeTemplate(input: string) {
    const allVars = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;

    const tokens: TemplateToken[] = [];
    let lastIndex = 0;

    input.replace(allVars, (match, varName, offset) => {
        // Static part before the match
        const staticPart = input.slice(lastIndex, offset);
        if (staticPart) {
            tokens.push({ type: 'literal', value: staticPart });
        }

        tokens.push({ type: 'variable', name: varName });
        lastIndex = offset + match.length;

        return match;
    });

    // Remainder after last match
    const tail = input.slice(lastIndex);
    if (tail) {
        tokens.push({ type: 'literal', value: tail });
    }

    return tokens;
}

/**
 * Renders a Vega expression from an array of template tokens.
 * example input: [{ type: 'literal', value: 'foo' }, { type: 'variable', name: 'bar' }]
 * This will produce a string like: "'foo' + encodeURIComponent(bar)"
 * @param tokens - An array of template tokens.
 * @returns A string representing the rendered Vega expression.
 */
export function renderVegaExpression(tokens: TemplateToken[], funcName = 'encodeURIComponent'): string {
    const escape = (str: string) => `'${str.replace(/'/g, "\\'")}'`;

    return tokens
        .map(token =>
            token.type === 'literal'
                ? escape(token.value)
                : `${funcName}(${token.name})`
        )
        .join(' + ');
}

export function encodeTemplateVariables(input: string): string {
    const tokens = tokenizeTemplate(input);
    return renderVegaExpression(tokens);
}

/*
const tests = [
    // ✅ No variables
    ["foobar", "'foobar'"],

    // ✅ Single valid variable in middle
    ["foo{{bar}}baz", "'foo' + encodeURIComponent(bar) + 'baz'"],

    // ✅ Multiple valid variables
    ["{{a}}-{{b}}/{{c}}", "encodeURIComponent(a) + '-' + encodeURIComponent(b) + '/' + encodeURIComponent(c)"],

    // ✅ Valid variable at start
    ["{{bar}}baz", "encodeURIComponent(bar) + 'baz'"],

    // ✅ Valid variable at end
    ["foo{{bar}}", "'foo' + encodeURIComponent(bar)"],

    // ✅ Only a variable
    ["{{bar}}", "encodeURIComponent(bar)"],

    // ✅ Starts with single quote in static text
    ["'quote{{bar}}", "'\\'quote' + encodeURIComponent(bar)"],

    // ✅ Ends with single quote in static text
    ["foo{{bar}}'", "'foo' + encodeURIComponent(bar) + '\\''"],

    // ✅ Single quotes around and between variables
    ["'a'{{b}}'c'", "'\\'a\\'' + encodeURIComponent(b) + '\\'c\\''"],

    // ✅ Underscore and digits in variable name
    ["pre_{{var_123}}_post", "'pre_' + encodeURIComponent(var_123) + '_post'"],

    // ❌ Invalid variable (starts with number) should be left untouched
    ["foo{{123abc}}baz", "'foo{{123abc}}baz'"],

    // ❌ Invalid variable (contains dash) should be left untouched
    ["foo{{bad-name}}baz", "'foo{{bad-name}}baz'"],

    // ❌ Invalid variable (has space inside) should be left untouched
    ["foo{{ some thing }}baz", "'foo{{ some thing }}baz'"],

    // 🔄 Mix of valid and invalid: only valid one gets replaced
    ["a{{1bad}}b{{good}}c", "'a{{1bad}}b' + encodeURIComponent(good) + 'c'"],

    // 🔄 Complex mixed: valid and invalid placeholders
    ["{{ok}} {{1bad}} x{{also_ok}}y", "encodeURIComponent(ok) + ' {{1bad}} x' + encodeURIComponent(also_ok) + 'y'"],

    // 🧪 Static string with single quotes
    ["a'b'c", "'a\\'b\\'c'"],

    // 🧪 Single quotes in middle with variables
    ["{{x}}'middle'{{y}}", "encodeURIComponent(x) + '\\'middle\\'' + encodeURIComponent(y)"],

    // 🧪 Backslashes in static part (not escaped here, just preserved)
    ["path\\to\\file{{var}}", "'path\\to\\file' + encodeURIComponent(var)"],
];

tests.forEach(([input, expected], i) => {
    const output = encodeTemplateVariables(input);
    const pass = output === expected;

    console.log(
        `${pass ? '✅' : '❌'} Test ${i + 1}: ${pass ? 'PASS' : `FAIL\n  Input: ${input}\n  Got: ${output}\n  Expected: ${expected}`}`
    );
});

*/