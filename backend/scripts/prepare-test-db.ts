import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const backendRoot = path.join(__dirname, '..');
const testDbPath = path.resolve(backendRoot, '..', 'db', 'pharmacy.test.sqlite');
const databaseUrl = `file:${path.relative(backendRoot, testDbPath).replace(/\\/g, '/')}`;

fs.mkdirSync(path.dirname(testDbPath), { recursive: true });
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const env = { ...process.env, DATABASE_URL: databaseUrl };

execSync('npx prisma db push', { cwd: backendRoot, env, stdio: 'inherit' });
execSync('tsx seed/seed.ts --fresh', { cwd: backendRoot, env, stdio: 'inherit' });
