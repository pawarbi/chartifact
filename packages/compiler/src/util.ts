/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { DataSourceBaseFormat, DataSourceByDynamicURL, ImageElement, InteractiveElement, InteractiveDocument, PageElement, UrlRef } from '@microsoft/chartifact-schema';
import { Spec as VegaSpec } from 'vega-typings';
import { TopLevelSpec as VegaLiteSpec } from "vega-lite";

export function safeVariableName(name: string) {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

export function getFileExtension(urlOrFileName: string) {
    const parts = urlOrFileName.split('.');
    return parts[parts.length - 1];
}

export const dataSourceBaseFormats: DataSourceBaseFormat[] = ['json', 'csv', 'tsv'];

export function getFormatByURLOrFileName(urlOrFileName: string): DataSourceBaseFormat | undefined {
    const extension = getFileExtension(urlOrFileName).toLocaleLowerCase();
    if (dataSourceBaseFormats.includes(extension as DataSourceBaseFormat)) {
        return extension as DataSourceBaseFormat;
    }
    return undefined;
}

export function exemplarUrl(dataSource: DataSourceByDynamicURL) {
    //if there are no mappedParams, return the baseURL
    if (!dataSource.urlRef.mappedParams || dataSource.urlRef.mappedParams.length === 0) {
        return urlRefToBaseUrl(dataSource.urlRef);
    }
    //TODO urlPath may have a query string

    //make a copy of dataSource.mappedParams
    const params = dataSource.urlRef.mappedParams.map(param => ({ ...param }));
    //if a param is named **kwargs, then it is a querystring-style string of paramName=paramValue&etc
    const kwargs = params.find(param => param.name === '**kwargs');
    //build url with all non-**kwargs params
    let query = params.filter(param => param.name !== '**kwargs').map(param => `${param.name}=${param.value}`).join('&');
    //if there are **kwargs, append to query
    if (kwargs) {
        if (query.length > 0) {
            query += '&';
        }
        query += kwargs.value;
    }
    return `${urlRefToBaseUrl(dataSource.urlRef)}?${query}`;
}

export function getChartType(spec?: VegaSpec | VegaLiteSpec) {
    const $schema = spec?.$schema;
    if (!$schema) {
        return 'vega-lite';
    }
    return $schema.includes('vega-lite') ? 'vega-lite' : 'vega';
}

const interactiveTypes = ['checkbox', 'dropdown', 'slider', 'textbox'];

export function isInteractiveElement(element: PageElement) {
    if (typeof element === 'string') {
        return false;
    }
    if (typeof element !== 'object') {
        return false;
    }
    return interactiveTypes.includes(element.type);
}

export function getInteractiveElements(page: InteractiveDocument) {
    const interactiveElements = page.groups.map(g => g.elements).flat().filter(e => isInteractiveElement(e)) as InteractiveElement[];
    return interactiveElements;
}

export function compareUrls(a: string, b: string) {
    if (a === b) {
        return true;
    }
    if (!a && !b) {
        return true;
    }
    if (!a || !b) {
        return false;
    }
    const urlA = new URL(a);
    const urlB = new URL(b);
    return urlA.protocol === urlB.protocol
        && urlA.origin === urlB.origin
        && urlA.pathname === urlB.pathname
        && urlA.search === urlB.search
        && urlA.hash === urlB.hash
        ;
}

export function gatherPageOrigins(page: InteractiveDocument) {
    const origins = new Set<string>();

    // Collect origins from dataLoaders
    page.dataLoaders.forEach(loader => {
        if (loader.type === 'url') {
            origins.add(loader.urlRef.origin);
        }
    });

    // Collect origins from elements in groups
    page.groups.forEach(group => {
        group.elements.forEach(element => {
            if (typeof element === 'object' && element.type === 'image') {
                origins.add(element.urlRef.origin);
            }
        });
    });

    return Array.from(origins);
}

export function changePageOrigin(page: InteractiveDocument, oldOrigin: string, newOriginUrl: URL) {
    const newPage: InteractiveDocument = {
        ...page,
        dataLoaders: page.dataLoaders.map(loader => {
            if (loader.type === 'url' && loader.urlRef.origin === oldOrigin) {
                return {
                    ...loader,
                    urlRef: {
                        ...loader.urlRef,
                        origin: newOriginUrl.origin,
                    },
                };
            }
            return loader;
        }),
        groups: page.groups.map(group => ({
            ...group,
            elements: group.elements.map(element => {
                if (typeof element === 'object' && element.type === 'image' && element.urlRef.origin === oldOrigin) {
                    const newImageElement: ImageElement = {
                        ...element,
                        urlRef: {
                            ...element.urlRef,
                            origin: newOriginUrl.origin,
                        },
                    };
                    return newImageElement;
                }
                return element;
            }),
        })),
    };
    return newPage;
}

export function urlRefToBaseUrl(urlRef: UrlRef) {
    //make sure there is a slash between origin and urlPath
    const baseUrl = urlRef.origin + (urlRef.urlPath.startsWith('/') ? '' : '/') + urlRef.urlPath;
    return baseUrl;
}

export type TemplateToken =
  | { type: 'literal'; value: string }
  | { type: 'variable'; name: string };

export function tokenizeTemplate(input: string): TemplateToken[] {
  const allVars = /{{\s*(.*?)\s*}}/g;
  const validVar = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  const tokens: TemplateToken[] = [];
  let lastIndex = 0;
  let buffer = '';

  input.replace(allVars, (match, varName, offset) => {
    const staticPart = input.slice(lastIndex, offset);
    buffer += staticPart;
    lastIndex = offset + match.length;

    if (validVar.test(varName)) {
      if (buffer) {
        tokens.push({ type: 'literal', value: buffer });
        buffer = '';
      }
      tokens.push({ type: 'variable', name: varName });
    } else {
      buffer += match; // Keep invalid var in the buffer
    }

    return match;
  });

  buffer += input.slice(lastIndex);
  if (buffer) {
    tokens.push({ type: 'literal', value: buffer });
  }

  return tokens;
}

export function renderVegaExpression(tokens: TemplateToken[]): string {
    const escape = (str: string) => `'${str.replace(/'/g, "\\'")}'`;

    return tokens
        .map(token =>
            token.type === 'literal'
                ? escape(token.value)
                : `encodeURIComponent(${token.name})`
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