import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, pred, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full, pred, out);
    } else if (pred(name, full)) {
      out.push(full);
    }
  }
  return out;
}

function relImport(filePath, subpath) {
  const fromDir = path.dirname(filePath);
  const target = path.join(root, 'src', 'app', subpath);
  let rel = path.relative(fromDir, target).replace(/\\/g, '/');
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  return rel;
}

function ensureImport(src, symbol, fromPath) {
  if (src.includes(symbol) && src.includes(fromPath)) {
    return src;
  }
  const idx = src.indexOf('@Component');
  const line = `import { ${symbol} } from '${fromPath}';\n`;
  if (!src.includes(fromPath)) {
    return src.slice(0, idx) + line + src.slice(idx);
  }
  return src;
}

const detailFiles = walk(
  path.join(root, 'src', 'app'),
  (n) => n.endsWith('-detail.component.ts') && !n.endsWith('.spec.ts'),
);

for (const filePath of detailFiles) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('save():') && !src.includes('save(): void')) {
    continue;
  }
  if (src.includes('detailShortcutBinding')) {
    continue;
  }

  const kb = relImport(filePath, 'core/keyboard');
  const saveSvc = relImport(filePath, 'core/services/active-screen-save.service');
  const printSvc = relImport(filePath, 'core/services/active-screen-print.service');
  const tooltip = relImport(filePath, 'shared/keyboard');

  if (!src.includes('OnDestroy')) {
    src = src.replace(
      /import \{([^}]+)\} from '@angular\/core';/,
      (m, imp) => {
        const parts = new Set(imp.split(',').map((s) => s.trim()));
        parts.add('OnDestroy');
        parts.add('inject');
        return `import { ${[...parts].join(', ')} } from '@angular/core';`;
      },
    );
  }

  const block = `
import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '${kb}';
import { ActiveScreenPrintService } from '${printSvc}';
import { ActiveScreenSaveService } from '${saveSvc}';
import { ShortcutTooltipDirective } from '${tooltip}';
`;
  const compAt = src.indexOf('@Component');
  src = src.slice(0, compAt) + block + src.slice(compAt);

  if (!src.includes('ShortcutTooltipDirective')) {
    src = src.replace(/imports:\s*\[/, 'imports: [\n    ShortcutTooltipDirective,');
  } else if (!src.match(/imports:\s*\[[\s\S]*ShortcutTooltipDirective/)) {
    src = src.replace(/imports:\s*\[/, 'imports: [\n    ShortcutTooltipDirective,');
  }

  src = src.replace(
    /export class (\w+) implements ([^{]+)\{/,
    (m, cls, impl) => {
      const parts = impl.split(',').map((s) => s.trim());
      if (!parts.includes('OnDestroy')) {
        parts.push('OnDestroy');
      }
      return `export class ${cls} implements ${parts.join(', ')} {`;
    },
  );

  const fields = `
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;
`;

  src = src.replace(/export class \w+ implements[^{]+\{/, (m) => m + fields);

  const hasDelete = src.includes('deleteRecord():');
  const hasGoBack = src.includes('goBack():');
  const printMethod =
    src.includes('print(): void') || src.includes('onPrint(): void');
  const printCall = src.includes('print(): void')
    ? '() => this.print()'
    : src.includes('onPrint(): void')
      ? '() => this.onPrint()'
      : null;

  const actionLines = ['save: () => this.save(),'];
  if (hasDelete) {
    actionLines.push('delete: () => this.deleteRecord(),');
  }
  if (hasGoBack) {
    actionLines.push('cancel: () => this.goBack(),');
  }
  if (printCall) {
    actionLines.push(`print: ${printCall},`);
  }

  const bind = `
    this.detailShortcutBinding = bindDetailScreenShortcuts(
      this.shortcuts,
      this.activeSave,
      this.activePrint,
      {
        ${actionLines.join('\n        ')}
      },
    );
`;

  src = src.replace(/ngOnInit\(\): void \{/, `ngOnInit(): void {${bind}`);

  if (src.includes('ngOnDestroy(): void {')) {
    src = src.replace(
      /ngOnDestroy\(\): void \{/,
      'ngOnDestroy(): void {\n    this.detailShortcutBinding?.unregister();',
    );
  } else {
    src = src.replace(
      /\n  ([a-z][\w]*\([^)]*\)[^{]*\{)/,
      '\n  ngOnDestroy(): void {\n    this.detailShortcutBinding?.unregister();\n  }\n\n  $1',
    );
  }

  fs.writeFileSync(filePath, src);
  console.log('ts', path.relative(root, filePath));
}

const htmlFiles = walk(
  path.join(root, 'src', 'app'),
  (n, full) =>
    n.endsWith('-detail.component.html') &&
    fs.readFileSync(full, 'utf8').includes('detail-form__actions'),
);

for (const htmlPath of htmlFiles) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const orig = html;

  html = html.replace(
    /<button pButton type="submit"([^>]*)>/g,
    (m, rest) => {
      if (m.includes('appShortcutTooltip')) return m;
      return `<button pButton type="submit"${rest} appShortcutTooltip="Save" shortcutId="global.save" shortcutTooltipPosition="bottom">`;
    },
  );
  html = html.replace(
    /<button([^>]*)\(click\)="deleteRecord\(\)"([^>]*)>/g,
    (m) => {
      if (m.includes('appShortcutTooltip')) return m;
      return m.replace(
        /<button/,
        '<button appShortcutTooltip="Delete" shortcutId="global.delete" shortcutTooltipPosition="bottom"',
      );
    },
  );
  html = html.replace(
    /<button([^>]*)\(click\)="goBack\(\)"([^>]*)>/g,
    (m) => {
      if (m.includes('appShortcutTooltip')) return m;
      return m.replace(
        /<button/,
        '<button appShortcutTooltip="Back" shortcutId="global.cancel" shortcutTooltipPosition="bottom"',
      );
    },
  );

  if (html !== orig) {
    fs.writeFileSync(htmlPath, html);
    console.log('html', path.relative(root, htmlPath));
  }
}