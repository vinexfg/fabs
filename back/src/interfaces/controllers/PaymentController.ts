import type { Request, Response } from 'express';
import paymentRepository from '../../infrastructure/repositories/PaymentRepository';

const list = (req: Request, res: Response) => {
  res.json(paymentRepository.findAll());
};

const listInadimplencia = (req: Request, res: Response) => {
  res.json(paymentRepository.findInadimplencia());
};

const listByPatient = (req: Request, res: Response) => {
  res.json(paymentRepository.findByPatient(req.params.patientId));
};

const create = (req: Request, res: Response) => {
  if (!req.body.patientId || !req.body.descricao || !req.body.valor) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }
  res.json(paymentRepository.create(req.body));
};

const update = (req: Request, res: Response) => {
  if (!req.body.descricao || !req.body.valor) return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  res.json(paymentRepository.update(req.params.id, req.body));
};

const remove = (req: Request, res: Response) => {
  paymentRepository.remove(req.params.id);
  res.json({ ok: true });
};

export default { list, listInadimplencia, listByPatient, create, update, remove };
