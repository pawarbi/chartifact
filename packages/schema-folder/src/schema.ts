/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Folder } from './folder.js';

/** JSON Schema version with $schema property for validation */
export type FolderWithSchema = Folder & {
  $schema?: string;
};
