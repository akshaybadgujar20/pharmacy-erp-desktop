import { readFileSync } from 'fs';
import { join } from 'path';

const DATA_ROOT = join(__dirname, '..', 'data');

export function loadJson<T>(relativePath: string): T[] {
  const fullPath = join(DATA_ROOT, relativePath);
  const raw = readFileSync(fullPath, 'utf-8');
  const parsed = JSON.parse(raw) as T[] | { data: T[] };
  return Array.isArray(parsed) ? parsed : parsed.data;
}
