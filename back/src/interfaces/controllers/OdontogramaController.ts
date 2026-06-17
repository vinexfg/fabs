import type { Request, Response } from 'express';
import odontogramaRepository from '../../infrastructure/repositories/OdontogramaRepository';

const listByPatient = (req: Request, res: Response) => {
  res.json(odontogramaRepository.findByPatient(req.params.patientId));
};

const upsert = (req: Request, res: Response) => {
  if (!req.body.tooth) return res.status(400).json({ error: 'tooth é obrigatório' });
  const existing = odontogramaRepository.findByPatientAndTooth(req.params.patientId, req.body.tooth);
  if (existing) return res.json(odontogramaRepository.updateTooth(existing.id, req.body));
  res.json(odontogramaRepository.createTooth(req.params.patientId, req.body));
};

export default { listByPatient, upsert };
