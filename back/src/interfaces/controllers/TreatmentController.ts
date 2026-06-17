import type { Request, Response } from 'express';
import treatmentRepository from '../../infrastructure/repositories/TreatmentRepository';

const listByPatient = (req: Request, res: Response) => {
  res.json(treatmentRepository.findByPatient(req.params.patientId));
};

const create = (req: Request, res: Response) => {
  if (!req.body.patientId || !req.body.proc) return res.status(400).json({ error: 'patientId e proc são obrigatórios' });
  res.json(treatmentRepository.create(req.body));
};

const updateStatus = (req: Request, res: Response) => {
  res.json(treatmentRepository.updateStatus(req.params.id, req.body.status));
};

const remove = (req: Request, res: Response) => {
  treatmentRepository.remove(req.params.id);
  res.json({ ok: true });
};

export default { listByPatient, create, updateStatus, remove };
