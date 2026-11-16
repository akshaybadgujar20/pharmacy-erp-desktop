import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = path.join(root, 'src', 'app');

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

function patchListFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (src.includes('bindListScreenShortcuts')) {
    return false;
  }
  if (!src.includes('KeyboardShortcutService')) {
    return false;
  }
  if (!src.includes('AppGridComponent')) {
    return false;
  }

  const hasCreate = /registerHandler\('global\.new'/.test(src);
  const hasRefresh = /registerHandler\('global\.refresh'/.test(src);

  if (!hasCreate && !hasRefresh) {
    return false;
  }

  if (!src.includes('viewChild')) {
    src = src.replace(
      /from '@angular\/core';/,
      (m) =>
        `${m}\n`.replace(
          "from '@angular/core';",
          "from '@angular/core';",
        ),
    );
    src = src.replace(
      /import \{([^}]+)\} from '@angular\/core';/,
      (match, imports) => {
        const parts = imports.split(',').map((s) => s.trim());
        if (!parts.includes('viewChild')) {
          parts.push('viewChild');
        }
        return `import { ${parts.join(', ')} } from '@angular/core';`;
      },
    );
  } else if (!/viewChild/.test(src.split("from '@angular/core'")[0] + src.match(/import \{([^}]+)\} from '@angular\/core'/)?.[1])) {
    src = src.replace(
      /import \{([^}]+)\} from '@angular\/core';/,
      (match, imports) => {
        const parts = imports.split(',').map((s) => s.trim());
        if (!parts.includes('viewChild')) {
          parts.push('viewChild');
        }
        return `import { ${parts.join(', ')} } from '@angular/core';`;
      },
    );
  }

  if (!src.includes('ActiveScreenSearchService')) {
    src = src.replace(
      /import \{ KeyboardShortcutService \} from '([^']+)';/,
      `import {
  bindListScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '$1';
import { ActiveScreenSearchService } from '$1'.includes('core/keyboard')
  ? '../../core/services/active-screen-search.service'
  : '$1';`,
    );
    // Fix botched replace - do manual path depth
    const depth = (filePath.match(/features|components/g) || []).length;
    const relCore = filePath.includes('features\\')
      ? filePath.split('features')[1].split(path.sep).filter(Boolean).length
      : 3;
    const up = '../'.repeat(relCore);
    src = src.replace(
      /import \{ KeyboardShortcutService \} from '([^']+)';/,
      `import {
  bindListScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '$1';
import { ActiveScreenSearchService } from '${up}core/services/active-screen-search.service';`,
    );
  }

  if (!src.includes('viewChild(AppGridComponent)')) {
    src = src.replace(
      /(private readonly shortcuts = inject\(KeyboardShortcutService\);)/,
      `$1
  private readonly activeSearch = inject(ActiveScreenSearchService);
  private readonly grid = viewChild(AppGridComponent);
  private listShortcutBinding?: ShortcutBinding;`,
    );
  }

  const bindLines = [];
  if (hasRefresh) {
    bindLines.push('refresh: () => this.load(),');
  }
  if (hasCreate) {
    bindLines.push('create: () => this.onNew(),');
  }
  bindLines.push('focusSearch: () => this.grid()?.focusSearch(),');

  const bindBlock = `this.listShortcutBinding = bindListScreenShortcuts(this.shortcuts, this.activeSearch, {
      ${bindLines.join('\n      ')}
    });`;

  src = src.replace(
    /\s*this\.shortcuts\.registerHandler\('global\.refresh'[^;]+;[\s\S]*?(this\.shortcuts\.unregisterHandler\('global\.new'[^;]+;)?/m,
    '',
  );

  src = src.replace(/(ngOnInit\(\)[^{]*\{)/, `$1\n    ${bindBlock}\n`);

  src = src.replace(
    /\s*this\.shortcuts\.unregisterHandler\('global\.refresh'\);[\s\S]*?this\.shortcuts\.unregisterHandler\('global\.new'\);/m,
    '\n    this.listShortcutBinding?.unregister();',
  );

  if (!src.includes('listShortcutBinding?.unregister')) {
    src = src.replace(
      /(ngOnDestroy\(\)[^{]*\{)/,
      `$1\n    this.listShortcutBinding?.unregister();`,
    );
  }

  // Sales-specific
  if (filePath.includes('sales-invoice-list')) {
    src = src.replace(
      /bindListScreenShortcuts\(this\.shortcuts, this\.activeSearch, \{([^}]+)\}\);/,
      (m, body) => {
        return `bindListScreenShortcuts(this.shortcuts, this.activeSearch, {${body}});
    this.shortcuts.registerHandler('sales.new', () => this.onNew());`;
      },
    );
    if (!src.includes("unregisterHandler('sales.new')")) {
      src = src.replace(
        /this\.listShortcutBinding\?\.unregister\(\);/,
        `this.listShortcutBinding?.unregister();
    this.shortcuts.unregisterHandler('sales.new');`,
      );
    }
  }

  fs.writeFileSync(filePath, src);
  return true;
}

const files = walk(appRoot);
let count = 0;
for (const f of files) {
  if (patchListFile(f)) {
    count++;
    console.log('patched', path.relative(root, f));
  }
}
console.log('done', count);