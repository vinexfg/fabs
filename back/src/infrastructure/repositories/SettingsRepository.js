const { db } = require('../database/connection');

const PUBLIC_KEYS = ['clinicName', 'doctorName', 'cro', 'clinicAddress', 'clinicPhone'];

const findPublic = () => {
  const rows = db.prepare(`SELECT key, value FROM settings WHERE key IN (${PUBLIC_KEYS.map(() => '?').join(',')})`)
    .all(...PUBLIC_KEYS);
  const result = {};
  rows.forEach((row) => { result[row.key] = row.value; });
  return result;
};

const findByKey = (key) =>
  db.prepare('SELECT value FROM settings WHERE key = ?').get(key);

const upsert = (key, value) =>
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);

const upsertPublicFields = (body) => {
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  PUBLIC_KEYS.forEach((key) => {
    if (body[key] !== undefined) update.run(key, body[key]);
  });
};

module.exports = { findPublic, findByKey, upsert, upsertPublicFields };
