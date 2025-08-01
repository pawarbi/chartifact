/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { DataSourceBaseFormat, InteractiveElement, InteractiveDocument, PageElement } from '@microsoft/chartifact-schema';
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

