const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['data.db'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // runMigrations() usa catch {} proposital para ALTER TABLE idempotente (ver CLAUDE.md).
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
