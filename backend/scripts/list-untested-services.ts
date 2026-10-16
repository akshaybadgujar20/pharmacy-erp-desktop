import fs from 'fs';
import path from 'path';

const backendRoot = path.join(__dirname, '..');
const srcRoot = path.join(backendRoot, 'src');

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.name.endsWith('.service.ts') && !entry.name.endsWith('.spec.ts')) {
      files.push(full);
    }
  }
  return files;
}

const services = walk(srcRoot).sort();
const missing: string[] = [];
const covered: string[] = [];

for (const servicePath of services) {
  const specPath = servicePath.replace(/\.service\.ts$/, '.service.spec.ts');
  if (fs.existsSync(specPath)) {
    covered.push(path.relative(backendRoot, servicePath));
  } else {
    missing.push(path.relative(backendRoot, servicePath));
  }
}

console.log(`Services: ${services.length}, with spec: ${covered.length}, missing: ${missing.length}\n`);
if (missing.length > 0) {
  console.log('Missing *.service.spec.ts:');
  for (const file of missing) {
    console.log(`  ${file}`);
  }
}
