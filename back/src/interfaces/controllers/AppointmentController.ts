import type { Request, Response } from 'express';
import appointmentRepository from '../../infrastructure/repositories/AppointmentRepository';

const list = (req: Request, res: Response) => {
  const { date, month, week } = req.query as { date?: string; month?: string; week?: string };
  if (date)  return res.json(appointmentRepository.findByDate(date));
  if (month) return res.json(appointmentRepository.findByMonth(month));
  if (week)  return res.json(appointmentRepository.findByWeek(week));
  res.json(appointmentRepository.findAll());
};

const listTomorrow = (req: Request, res: Response) => {
  res.json(appointmentRepository.findTomorrow());
};

const listByPatient = (req: Request, res: Response) => {
  res.json(appointmentRepository.findByPatient(req.params.patientId));
};

const create = (req: Request, res: Response) => {
  if (!req.body.patientId || !req.body.date || !req.body.time) {
    return res.status(400).json({ error: 'patientId, date e time são obrigatórios' });
  }
  res.json(appointmentRepository.create(req.body));
};

const update = (req: Request, res: Response) => {
  res.json(appointmentRepository.update(req.params.id, req.body));
};

const updateStatus = (req: Request, res: Response) => {
  res.json(appointmentRepository.updateStatus(req.params.id, req.body.status));
};

const remove = (req: Request, res: Response) => {
  appointmentRepository.remove(req.params.id);
  res.json({ ok: true });
};

export default { list, listTomorrow, listByPatient, create, update, updateStatus, remove };
