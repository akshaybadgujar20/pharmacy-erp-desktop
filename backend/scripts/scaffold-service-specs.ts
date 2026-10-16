/**
 * Creates minimal co-located *.service.spec.ts for services that lack one.
 * Run from backend/: npx tsx scripts/scaffold-service-specs.ts [module-prefix]
 * Example: npx tsx scripts/scaffold-service-specs.ts src/security
 */
import fs from 'fs';
import path from 'path';

const backendRoot = path.join(__dirname, '..');
const srcRoot = path.join(backendRoot, 'src');
const filterPrefix = process.argv[2]?.replace(/\\/g, '/');

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.name.endsWith('.service.ts')) {
      files.push(full);
    }
  }
  return files;
}

function relImport(fromDir: string, toFile: string): string {
  let rel = path.relative(fromDir, toFile).replace(/\\/g, '/');
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  return rel.replace(/\.ts$/, '');
}

function depthToPrisma(serviceDir: string): string {
  const rel = path.relative(srcRoot, serviceDir).replace(/\\/g, '/');
  const depth = rel.split('/').length;
  return '../'.repeat(depth) + 'prisma.service';
}

function depthToSegment(serviceDir: string, segment: string): string {
  const rel = path.relative(srcRoot, serviceDir).replace(/\\/g, '/');
  const depth = rel.split('/').length;
  return '../'.repeat(depth) + segment;
}

function scaffold(servicePath: string): void {
  const specPath = servicePath.replace(/\.service\.ts$/, '.service.spec.ts');
  if (fs.existsSync(specPath)) {
    return;
  }

  const serviceDir = path.dirname(servicePath);
  const baseName = path.basename(servicePath, '.service.ts');
  const serviceClass = `${baseName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}Service`;
  const serviceImport = `./${baseName}.service`;

  const prismaImport = depthToPrisma(serviceDir);
  const uowImport = depthToSegment(serviceDir, 'persistence/unit-of-work/unit-of-work.service');
  const auditImport = depthToSegment(serviceDir, 'audit/audit.service');
  const outboxImport = depthToSegment(serviceDir, 'persistence/outbox/outbox.service');
  const ctxImport = depthToSegment(serviceDir, 'persistence/context/request-context.service');

  const content = `import { Test, TestingModule } from '@nestjs/testing';
import { ${serviceClass} } from '${serviceImport}';

describe('${serviceClass}', () => {
  let service: ${serviceClass};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [${serviceClass}],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(${serviceClass});
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
`;

  fs.writeFileSync(specPath, content, 'utf8');
  console.log(`Created ${path.relative(backendRoot, specPath)}`);
}

const SKIP_FILES = new Set(['src/prisma.service.ts', 'src/app.service.ts']);

const services = walk(srcRoot).filter((p) => {
  const rel = path.relative(backendRoot, p).replace(/\\/g, '/');
  if (SKIP_FILES.has(rel)) {
    return false;
  }
  if (filterPrefix && !rel.startsWith(filterPrefix)) {
    return false;
  }
  return true;
});

for (const servicePath of services) {
  scaffold(servicePath);
}
