const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', '..', 'data.db');
const db = new DatabaseSync(dbPath);

module.exports = { db };
