import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const backendRoot = path.resolve(here, '../..');
export const uploadsDir = path.resolve(backendRoot, 'uploads');
