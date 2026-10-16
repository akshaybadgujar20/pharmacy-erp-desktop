import fs from 'fs';
import path from 'path';

const backendRoot = path.join(__dirname, '..');
const srcRoot = path.join(backendRoot, 'src');

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.name.endsWith('.service.spec.ts')) {
      files.push(full);
    }
  }
  return files;
}

const MARKER = 'useValue: { client: {} }';

for (const specPath of walk(srcRoot)) {
  const content = fs.readFileSync(specPath, 'utf8');
  if (!content.includes(MARKER)) {
    continue;
  }

  const serviceDir = path.dirname(specPath);
  const baseName = path.basename(specPath, '.service.spec.ts');
  const serviceClass = `${baseName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}Service`;

  const next = `import { Test, TestingModule } from '@nestjs/testing';
import { ${serviceClass} } from './${baseName}.service';

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

  fs.writeFileSync(specPath, next, 'utf8');
  console.log(`Fixed ${path.relative(backendRoot, specPath)}`);
}
