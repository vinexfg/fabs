import type { Request, Response } from 'express';
import evolutionRepository from '../../infrastructure/repositories/EvolutionRepository';

const listByPatient = (req: Request, res: Response) => {
  res.json(evolutionRepository.findByPatient(req.params.patientId));
};

const create = (req: Request, res: Response) => {
  if (!req.body.patientId || !req.body.proc || !req.body.data) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }
  res.json(evolutionRepository.create(req.body));
};

const update = (req: Request, res: Response) => {
  if (!req.body.proc || !req.body.data) return res.status(400).json({ error: 'proc e data são obrigatórios' });
  res.json(evolutionRepository.update(req.params.id, req.body));
};

const remove = (req: Request, res: Response) => {
  evolutionRepository.remove(req.params.id);
  res.json({ ok: true });
};

export default { listByPatient, create, update, remove };
