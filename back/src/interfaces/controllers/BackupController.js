const backupRepository = require('../../infrastructure/repositories/BackupRepository');

const exportBackup = (req, res) => {
  const data = backupRepository.exportAll();
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Disposition', `attachment; filename="backup-dentefacil-${date}.json"`);
  res.json(data);
};

const restore = (req, res) => {
  try {
    const restored = backupRepository.restore(req.body);
    res.json({ ok: true, restored });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { exportBackup, restore };
