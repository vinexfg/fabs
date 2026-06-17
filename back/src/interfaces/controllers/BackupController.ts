import type { Request, Response } from 'express';
import backupRepository from '../../infrastructure/repositories/BackupRepository';

const exportBackup = (req: Request, res: Response) => {
  const data = backupRepository.exportAll();
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Disposition', `attachment; filename="backup-dentefacil-${date}.json"`);
  res.json(data);
};

const restore = (req: Request, res: Response) => {
  try {
    const restored = backupRepository.restore(req.body);
    res.json({ ok: true, restored });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao restaurar backup' });
  }
};

export default { exportBackup, restore };
