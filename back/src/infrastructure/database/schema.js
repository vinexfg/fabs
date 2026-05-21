const { createHash } = require('crypto');
const { db } = require('./connection');

const hashPw = (password) => createHash('sha256').update(password + '_df2024').digest('hex');

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      dataNascimento TEXT,
      cpf TEXT,
      telefone TEXT,
      email TEXT,
      endereco TEXT,
      convenio TEXT,
      alergias TEXT,
      medicamentos TEXT,
      conds TEXT,
      queixa TEXT,
      foto TEXT,
      criadoEm TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS treatments (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      proc TEXT NOT NULL,
      dente TEXT,
      valor REAL DEFAULT 0,
      status TEXT DEFAULT 'pendente',
      obs TEXT,
      criadoEm TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      data TEXT,
      forma TEXT,
      criadoEm TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS evolutions (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      proc TEXT NOT NULL,
      data TEXT,
      hora TEXT,
      notas TEXT,
      proxConsulta TEXT,
      criadoEm TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER DEFAULT 60,
      type TEXT DEFAULT 'Consulta',
      status TEXT DEFAULT 'agendado',
      notes TEXT,
      criadoEm TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS odontograma (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      tooth TEXT NOT NULL,
      status TEXT DEFAULT 'saudavel',
      notes TEXT,
      updatedAt TEXT DEFAULT (datetime('now')),
      UNIQUE(patientId, tooth),
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      valor REAL DEFAULT 0,
      obs TEXT
    );
  `);
};

const runMigrations = () => {
  try { db.exec('ALTER TABLE patients ADD COLUMN foto TEXT'); } catch {}
};

const seedDefaultSettings = () => {
  const defaultSettings = [
    ['password',      hashPw('1234')],
    ['clinicName',    'Meu Consultório Odontológico'],
    ['doctorName',    'Dr(a). Nome do Dentista'],
    ['cro',           'CRO-XX 00000'],
    ['clinicAddress', ''],
    ['clinicPhone',   ''],
  ];
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  defaultSettings.forEach(([key, value]) => insertSetting.run(key, value));
};

const seedDefaultTemplates = () => {
  const defaultTemplates = [
    ['tpl1',  'Consulta Inicial',               150,  ''],
    ['tpl2',  'Retorno / Consulta',              100,  ''],
    ['tpl3',  'Limpeza / Profilaxia',            200,  ''],
    ['tpl4',  'Restauração (resina)',            280,  'Por dente'],
    ['tpl5',  'Extração Simples',                250,  ''],
    ['tpl6',  'Extração de Siso',                500,  ''],
    ['tpl7',  'Tratamento de Canal (anterior)',   600,  'Dente anterior'],
    ['tpl8',  'Tratamento de Canal (posterior)',  900,  'Dente posterior/molar'],
    ['tpl9',  'Implante Osseointegrado',         2500, ''],
    ['tpl10', 'Coroa sobre Implante',            1500, ''],
    ['tpl11', 'Prótese Total (arcada)',          2000, 'Por arcada'],
    ['tpl12', 'Clareamento Dental',               800, ''],
    ['tpl13', 'Aparelho Ortodôntico',            2000, 'Instalação + 1ª manutenção'],
    ['tpl14', 'Manutenção Ortodôntica',           150, 'Mensalidade'],
    ['tpl15', 'Faceta de Porcelana',             1200, 'Por dente'],
  ];
  const insertTemplate = db.prepare('INSERT OR IGNORE INTO templates (id, name, valor, obs) VALUES (?, ?, ?, ?)');
  defaultTemplates.forEach((template) => insertTemplate.run(...template));
};

const initializeSchema = () => {
  createTables();
  runMigrations();
  seedDefaultSettings();
  seedDefaultTemplates();
};

module.exports = { initializeSchema, hashPw };
