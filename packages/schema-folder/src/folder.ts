/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

export interface RelativeUrl {
    href: string;
}

export interface Folder {
    title: string;

    /** Array of document URLs: either absolute, or relative to this folder location. */
    docUrls: string[];
}
