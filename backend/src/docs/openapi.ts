import fs from 'fs';
import path from 'path';
// js-yaml v5 ships without a default export; a default import resolves to
// undefined under some TS/ESM interop configurations, which silently broke
// /docs (the load() call below would throw "Cannot read properties of
// undefined"). A namespace import works under both CJS and ESM resolution.
import * as YAML from 'js-yaml';
import { logger } from '../utils/logger';

/** Loads the hand-maintained OpenAPI document at prisma-adjacent docs/openapi.yaml. */
export const loadOpenApiDocument = (): Record<string, unknown> | null => {
  try {
    const filePath = path.resolve(__dirname, 'openapi.yaml');
    const contents = fs.readFileSync(filePath, 'utf-8');
    return YAML.load(contents) as Record<string, unknown>;
  } catch (error) {
    logger.warn('OpenAPI document could not be loaded; /docs will be unavailable', error);
    return null;
  }
};
