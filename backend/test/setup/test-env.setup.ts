import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(__dirname, '../../.env.test') });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:../db/pharmacy.test.sqlite';
}
