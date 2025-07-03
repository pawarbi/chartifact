// Schema generation entry point
import { InteractiveDocument } from './page.js';

/** JSON Schema version with $schema property for validation */
export type InteractiveDocumentWithSchema = InteractiveDocument & {
  $schema?: string;
};
