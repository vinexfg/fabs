import type { Request, Response } from 'express';
import budgetRepository from '../../infrastructure/repositories/BudgetRepository';

const listByPatient = (req: Request, res: Response) => {
  res.json(budgetRepository.findByPatient(req.params.patientId));
};

const create = (req: Request, res: Response) => {
  if (!req.body.patientId) return res.status(400).json({ error: 'patientId é obrigatório' });
  res.json(budgetRepository.create(req.body));
};

const update = (req: Request, res: Response) => {
  res.json(budgetRepository.update(req.params.id, req.body));
};

const updateStatus = (req: Request, res: Response) => {
  if (!req.body.status) return res.status(400).json({ error: 'status é obrigatório' });
  res.json(budgetRepository.updateStatus(req.params.id, req.body.status));
};

const remove = (req: Request, res: Response) => {
  budgetRepository.remove(req.params.id);
  res.json({ ok: true });
};

export default { listByPatient, create, update, updateStatus, remove };
