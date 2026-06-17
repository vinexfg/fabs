import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', '..', 'data.db');
const db = new DatabaseSync(dbPath);

export { db };
