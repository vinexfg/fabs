const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, '..', '..', '..', 'data.db'));

module.exports = { db };
