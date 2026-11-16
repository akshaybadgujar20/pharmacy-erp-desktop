import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full, out);
    } else if (name.endsWith('-list.component.ts') && !name.endsWith('.spec.ts')) {
      out.push(full);
    }
  }
  return out;
}

for (const filePath of walk(path.join(root, 'src', 'app'))) {
  let src = fs.readFileSync(filePath, 'utf8');
  const orig = src;

  src = src.replace(/signal, , viewChild/g, 'signal, viewChild');
  src = src.replace(
    /import \{ ActiveScreenSearchService \} from '[^']+'\.includes[^;]+;\n?/g,
    '',
  );

  const kbImport = src.match(
    /import \{[\s\S]*?\} from '(\.\.\/)+core\/keyboard';/,
  );
  if (kbImport && src.includes('ActiveScreenSearchService') && !src.includes('active-screen-search')) {
    const prefix = kbImport[0].match(/from '((?:\.\.\/)+)/)[1];
    src = src.replace(
      kbImport[0],
      `${kbImport[0]}\nimport { ActiveScreenSearchService } from '${prefix}core/services/active-screen-search.service';`,
    );
  }

  if (!src.includes('active-screen-search') && src.includes('activeSearch')) {
    const rel = path
      .relative(path.dirname(filePath), path.join(root, 'src', 'app', 'core', 'services'))
      .replace(/\\/g, '/');
    const importPath = rel.startsWith('.') ? rel : `./${rel}`;
    const kb = src.match(/import \{[\s\S]*?\} from '([^']+core\/keyboard)';/);
    if (kb) {
      src = src.replace(
        kb[0],
        `${kb[0]}\nimport { ActiveScreenSearchService } from '${importPath}/active-screen-search.service';`,
      );
    }
  }

  if (src.includes('bindListScreenShortcuts')) {
    src = src.replace(
      /\n\s*this\.shortcuts\.registerHandler\('global\.new', \(\) => this\.onNew\(\)\);\n/g,
      '\n',
    );
  }
  src = src.replace(
    /\n\s*this\.shortcuts\.unregisterHandler\('global\.refresh'\);\s*\n/g,
    '\n',
  );
  src = src.replace(
    /\n\s*this\.shortcuts\.unregisterHandler\('global\.new'\);\s*\n/g,
    '\n',
  );

  while (
    (src.match(/this\.shortcuts\.registerHandler\('sales\.new'/g) || []).length > 1
  ) {
    src = src.replace(
      /\n\s*this\.shortcuts\.registerHandler\('sales\.new', \(\) => this\.onNew\(\)\);/,
      '',
    );
  }
  src = src.replace(
    /\n\s*this\.shortcuts\.registerHandler\('global\.new', \(\) => this\.onNew\(\)\);\n\s*this\.shortcuts\.registerHandler\('sales\.new', \(\) => this\.onNew\(\)\);/,
    '\n    this.shortcuts.registerHandler(\'sales.new\', () => this.onNew());',
  );

  if (src !== orig) {
    fs.writeFileSync(filePath, src);
    console.log('fixed', path.relative(root, filePath));
  }
}