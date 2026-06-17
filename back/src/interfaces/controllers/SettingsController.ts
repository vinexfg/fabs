import type { Request, Response } from 'express';
import settingsRepository from '../../infrastructure/repositories/SettingsRepository';
import { hashPw, verifyPw } from '../../infrastructure/database/schema';

const show = (req: Request, res: Response) => {
  res.json(settingsRepository.findPublic());
};

const update = (req: Request, res: Response) => {
  settingsRepository.upsertPublicFields(req.body);
  res.json({ ok: true });
};

const updatePassword = (req: Request, res: Response) => {
  if (!req.body.current || !req.body.next) return res.status(400).json({ error: 'Campos obrigatórios' });
  if (req.body.next.length < 6) return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
  const row = settingsRepository.findByKey('password');
  if (!row || !verifyPw(req.body.current, row.value)) return res.status(401).json({ error: 'Senha atual incorreta' });
  settingsRepository.upsert('password', hashPw(req.body.next));
  res.json({ ok: true });
};

const getNotes = (req: Request, res: Response) => {
  const row = settingsRepository.findByKey('dashboard_notes');
  res.json({ notes: row?.value ?? '' });
};

const updateNotes = (req: Request, res: Response) => {
  settingsRepository.upsert('dashboard_notes', req.body.notes ?? '');
  res.json({ ok: true });
};

export default { show, update, updatePassword, getNotes, updateNotes };
