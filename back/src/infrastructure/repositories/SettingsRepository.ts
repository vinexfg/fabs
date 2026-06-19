import { db } from '../database/connection';
import type { Setting } from '../../types/entities';

const PUBLIC_KEYS = ['clinicName', 'doctorName', 'cro', 'clinicAddress', 'clinicPhone'] as const;

const findPublic = (): Record<string, string> => {
  const rows = db.prepare(`SELECT key, value FROM settings WHERE key IN (${PUBLIC_KEYS.map(() => '?').join(',')})`)
    .all(...PUBLIC_KEYS) as unknown as Setting[];
  const result: Record<string, string> = {};
  rows.forEach((row) => { result[row.key] = row.value; });
  return result;
};

const findByKey = (key: string): Setting | undefined =>
  db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as unknown as Setting | undefined;

const upsert = (key: string, value: string) =>
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);

const upsertPublicFields = (body: Record<string, string | undefined>): void => {
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  PUBLIC_KEYS.forEach((key) => {
    if (body[key] !== undefined) update.run(key, body[key] as string);
  });
};

export default { findPublic, findByKey, upsert, upsertPublicFields };
