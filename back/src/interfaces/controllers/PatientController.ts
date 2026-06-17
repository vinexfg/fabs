import type { Request, Response } from 'express';
import patientRepository from '../../infrastructure/repositories/PatientRepository';

const list = (req: Request, res: Response) => {
  if (req.query.page !== undefined) {
    return res.json(patientRepository.findPaginated({
      q:     (req.query.search as string) || '',
      page:  Number(req.query.page)  || 1,
      limit: Number(req.query.limit) || 15,
    }));
  }
  res.json(patientRepository.findAll());
};

const show = (req: Request, res: Response) => {
  const patient = patientRepository.findById(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Não encontrado' });
  res.json(patient);
};

const create = (req: Request, res: Response) => {
  if (!req.body.nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  res.json(patientRepository.create(req.body));
};

const update = (req: Request, res: Response) => {
  if (!req.body.nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  res.json(patientRepository.update(req.params.id, req.body));
};

const remove = (req: Request, res: Response) => {
  patientRepository.remove(req.params.id);
  res.json({ ok: true });
};

export default { list, show, create, update, remove };
