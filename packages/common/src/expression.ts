/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

//import { parseExpression } from 'vega';

type VegaExpressionNode = {
    type: string;
    [key: string]: any;
};

/**
 * Collects all identifiers from a Vega expression AST.
 * use with the result of vega.parseExpression
 * example:
 * const ast = vega.parseExpression('datum.value + item.datum.value + 'f' + foo + 'b' + bar');
 * const identifiers = collectIdentifiers(ast);
 * console.log(identifiers); // Set { 'datum', 'item', 'foo', 'bar' }
 * @param ast - The Vega expression AST to analyze.
 * @returns A set of unique identifier names found in the AST.
 */
export function collectIdentifiers(ast: VegaExpressionNode): Set<string> {
    const identifiers = new Set<string>();

    function walk(node: VegaExpressionNode) {
        if (!node || typeof node !== 'object') return;

        switch (node.type) {
            case 'Identifier':
                if (!VEGA_BUILTIN_FUNCTIONS.includes(node.name)) {
                    identifiers.add(node.name);
                }
                break;

            case 'CallExpression':
                walk(node.callee); // still walk to get built-in func but filter later
                (node.arguments || []).forEach(walk);
                break;

            case 'MemberExpression':
                walk(node.object); // only the object may be a variable
                break;

            case 'BinaryExpression':
            case 'LogicalExpression':
                walk(node.left);
                walk(node.right);
                break;

            case 'ConditionalExpression':
                walk(node.test);
                walk(node.consequent);
                walk(node.alternate);
                break;

            case 'ArrayExpression':
                (node.elements || []).forEach(walk);
                break;

            default:
                for (const key in node) {
                    if (node.hasOwnProperty(key)) {
                        const value = node[key];
                        if (Array.isArray(value)) value.forEach(walk);
                        else if (typeof value === 'object') walk(value);
                    }
                }
        }
    }

    walk(ast);
    return identifiers;
}

export const VEGA_BUILTIN_FUNCTIONS = Object.freeze([
    // Built-ins from Vega Expression docs
    "abs", "acos", "asin", "atan", "atan2", "ceil", "clamp", "cos", "exp", "expm1",
    "floor", "hypot", "log", "log1p", "max", "min", "pow", "random", "round", "sign",
    "sin", "sqrt", "tan", "trunc", "length", "isNaN", "isFinite", "parseFloat",
    "parseInt", "Date", "now", "time", "utc", "timezoneOffset", "quarter", "month",
    "day", "hours", "minutes", "seconds", "milliseconds", "year"
]);

/*

const tests: [string, string[]][] = [
    // ✅ No variables
    ["'foo' + 42", []],

    // ✅ Single identifier
    ["foo", ["foo"]],

    // ✅ Simple binary expression
    ["foo + bar", ["foo", "bar"]],

    // ✅ Function call with variable
    ["length(foo)", ["foo"]],

    // ✅ Function call with array of identifiers
    ["length([a, b, 3])", ["a", "b"]],

    // ✅ Nested binary expression
    ["foo + (bar + (baz * 2))", ["foo", "bar", "baz"]],

    // ✅ Ternary conditional expression
    ["foo ? bar : baz", ["foo", "bar", "baz"]],

    // ✅ Member expressions
    ["config.x + data['y']", ["config", "data"]],

    // ✅ Deduplicates
    ["foo + foo + bar", ["foo", "bar"]],

    // ✅ Function call with no identifiers
    ["length([1, 2, 3])", []],

    // ✅ Array literal
    ["[foo, 'bar', baz]", ["foo", "baz"]],

    // ✅ Nested function calls
    ["log(sqrt(a) + cos(b))", ["a", "b"]],

    // ✅ Complex expression
    ["foo + '|' + (bar + length([1,2,3]) + 'z')", ["foo", "bar"]],
];

tests.forEach(([expr, expected], i) => {
    const ast = parseExpression(expr);
    const result = [...collectIdentifiers(ast)].sort();
    const pass = JSON.stringify(result) === JSON.stringify(expected.sort());

    console.log(
        `${pass ? '✅' : '❌'} Test ${i + 1}: ${pass ? 'PASS' : `FAIL\n  Expression: ${expr}\n  Got: ${JSON.stringify(result)}\n  Expected: ${JSON.stringify(expected)}`}`
    );
});

*/
