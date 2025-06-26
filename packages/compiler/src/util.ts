import { DataSourceBaseFormat, DataSourceByDynamicURL, extendedElements, ImageElement, InteractiveElement, InteractiveDocument, PageElement, UrlRef } from "dsl";
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

export function isInteractiveElement(element: PageElement<extendedElements>) {
    if (typeof element === 'string') {
        return false;
    }
    if (typeof element !== 'object') {
        return false;
    }
    return interactiveTypes.includes(element.type);
}

export function getInteractiveElements(page: InteractiveDocument<extendedElements>) {
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

export function gatherPageOrigins(page: InteractiveDocument<extendedElements>) {
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

export function changePageOrigin(page: InteractiveDocument<extendedElements>, oldOrigin: string, newOrigin: string) {
    const newOriginUrl = new URL(newOrigin, window.location.origin);
    const newPage: InteractiveDocument<extendedElements> = {
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
