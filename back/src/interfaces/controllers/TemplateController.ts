import type { Request, Response } from 'express';
import templateRepository from '../../infrastructure/repositories/TemplateRepository';

const list = (req: Request, res: Response) => {
  res.json(templateRepository.findAll());
};

const create = (req: Request, res: Response) => {
  if (!req.body.name) return res.status(400).json({ error: 'Nome obrigatório' });
  res.json(templateRepository.create(req.body));
};

const remove = (req: Request, res: Response) => {
  templateRepository.remove(req.params.id);
  res.json({ ok: true });
};

export default { list, create, remove };
