/**
 * Generates a markdown route index from NestJS controllers.
 * Run: npx ts-node scripts/generate-route-index.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC_ROOT = path.join(__dirname, '..', 'src');

interface RouteEntry {
  method: string;
  path: string;
  permission: string;
  module: string;
  controller: string;
}

const HTTP_DECORATORS = ['Get', 'Post', 'Patch', 'Put', 'Delete'] as const;

function moduleFromPath(filePath: string): string {
  const rel = path.relative(SRC_ROOT, filePath);
  const parts = rel.split(path.sep);
  const top = parts[0] ?? 'unknown';
  if (top.endsWith('.controller.ts')) {
    return top.replace('.controller.ts', '');
  }
  return top;
}

function extractControllerPrefix(content: string): string {
  const match = content.match(/@Controller\(\s*['"`]([^'"`]*?)['"`]\s*\)/);
  return match?.[1] ?? '';
}

function extractClassName(content: string): string {
  const match = content.match(/export class (\w+)/);
  return match?.[1] ?? 'Unknown';
}

function extractPermissionsNear(content: string, index: number): string {
  // Decorators are listed top-to-bottom; @RequirePermissions usually follows @Get/@Post
  const window = content.slice(index, index + 400);
  const match = window.match(/@RequirePermissions\(\s*([^)]+)\)/);
  if (!match) return '—';
  const perms = match[1]
    .split(',')
    .map((p) => p.trim().replace(/['"`]/g, ''))
    .filter(Boolean);
  return perms.join(', ');
}

function joinPaths(prefix: string, route: string): string {
  const p = prefix.replace(/\/$/, '');
  const r = route.startsWith('/') ? route : `/${route}`;
  if (!p) return r === '/' ? '/' : r;
  if (r === '/' || r === '') return p.startsWith('/') ? p : `/${p}`;
  const combined = `${p}${r}`;
  return combined.startsWith('/') ? combined : `/${combined}`;
}

function parseController(filePath: string): RouteEntry[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const prefix = extractControllerPrefix(content);
  const controller = extractClassName(content);
  const module = moduleFromPath(filePath);
  const entries: RouteEntry[] = [];

  for (const decorator of HTTP_DECORATORS) {
    const regex = new RegExp(
      `@${decorator}\\(\\s*(?:['"\`]([^'"\`]*)['"\`])?\\s*\\)`,
      'g',
    );
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const routeArg = match[1] ?? '';
      const fullPath = joinPaths(prefix, routeArg);
      const permission = extractPermissionsNear(content, match.index);
      entries.push({
        method: decorator.toUpperCase(),
        path: fullPath,
        permission,
        module,
        controller,
      });
    }
  }

  return entries;
}

function walkControllers(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkControllers(full));
    } else if (entry.name.endsWith('.controller.ts')) {
      results.push(full);
    }
  }
  return results;
}

function main(): void {
  const files = walkControllers(SRC_ROOT).sort();
  const routes = files.flatMap(parseController);
  routes.sort((a, b) => {
    const pathCmp = a.path.localeCompare(b.path);
    if (pathCmp !== 0) return pathCmp;
    return a.method.localeCompare(b.method);
  });

  const lines = [
    '| Method | Path | Module | Permission | Controller |',
    '|--------|------|--------|------------|------------|',
    ...routes.map(
      (r) =>
        `| ${r.method} | \`${r.path}\` | ${r.module} | ${r.permission} | ${r.controller} |`,
    ),
  ];

  const outPath = path.join(
    __dirname,
    '..',
    '..',
    'docs',
    'pharmacy_erp_architecture_docs',
    'architecture',
    'backend-route-index.md',
  );
  const header = `# Backend API Route Index

> Auto-generated from controllers. Regenerate: \`cd backend && npx ts-node scripts/generate-route-index.ts\`

Generated: ${new Date().toISOString().slice(0, 10)}

Total routes: ${routes.length}

`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, header + lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${routes.length} routes to ${outPath}`);
}

main();
