import { randomUUID } from 'crypto';
import { db } from '../database/connection';
import type { Appointment } from '../../types/entities';

export interface AppointmentInput {
  patientId: string;
  date: string;
  time: string;
  duration?: number;
  type?: string;
  status?: string;
  notes?: string | null;
}

type AppointmentWithPatient = Appointment & { patientNome: string; patientTelefone?: string };

const findByDate = (date: string): AppointmentWithPatient[] =>
  db.prepare(`
    SELECT a.*, p.nome as patientNome, p.telefone as patientTelefone
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    WHERE a.date = ?
    ORDER BY a.time
  `).all(date) as unknown as AppointmentWithPatient[];

const findByMonth = (month: string): AppointmentWithPatient[] =>
  db.prepare(`
    SELECT a.*, p.nome as patientNome
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    WHERE a.date LIKE ?
    ORDER BY a.date, a.time
  `).all(`${month}%`) as unknown as AppointmentWithPatient[];

const findByWeek = (startDate: string): AppointmentWithPatient[] =>
  db.prepare(`
    SELECT a.*, p.nome as patientNome, p.telefone as patientTelefone
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    WHERE a.date >= ? AND a.date < date(?, '+7 days')
    ORDER BY a.date, a.time
  `).all(startDate, startDate) as unknown as AppointmentWithPatient[];

const findAll = (): AppointmentWithPatient[] =>
  db.prepare(`
    SELECT a.*, p.nome as patientNome
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    ORDER BY a.date DESC, a.time
  `).all() as unknown as AppointmentWithPatient[];

const findTomorrow = (): AppointmentWithPatient[] => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().split('T')[0];
  return db.prepare(`
    SELECT a.*, p.nome as patientNome, p.telefone as patientTelefone
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    WHERE a.date = ? AND a.status = 'agendado'
    ORDER BY a.time
  `).all(date) as unknown as AppointmentWithPatient[];
};

const findByPatient = (patientId: string): Appointment[] =>
  db.prepare('SELECT * FROM appointments WHERE patientId = ? ORDER BY date DESC, time').all(patientId) as unknown as Appointment[];

const findById = (id: string): Appointment | undefined =>
  db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as unknown as Appointment | undefined;

const findByIdWithPatient = (id: string): AppointmentWithPatient | undefined =>
  db.prepare(`
    SELECT a.*, p.nome as patientNome, p.telefone as patientTelefone
    FROM appointments a JOIN patients p ON p.id = a.patientId
    WHERE a.id = ?
  `).get(id) as unknown as AppointmentWithPatient | undefined;

const create = ({ patientId, date, time, duration, type, status, notes }: AppointmentInput): AppointmentWithPatient | undefined => {
  const id = randomUUID();
  db.prepare('INSERT INTO appointments (id, patientId, date, time, duration, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, patientId, date, time, duration || 60, type || 'Consulta', status || 'agendado', notes ?? null);
  return findByIdWithPatient(id);
};

const update = (id: string, { date, time, duration, type, status, notes }: AppointmentInput): Appointment | undefined => {
  db.prepare('UPDATE appointments SET date=?, time=?, duration=?, type=?, status=?, notes=? WHERE id=?')
    .run(date, time, duration || 60, type || 'Consulta', status || 'agendado', notes ?? null, id);
  return findById(id);
};

const updateStatus = (id: string, status: string): Appointment | undefined => {
  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);
  return findById(id);
};

const remove = (id: string) =>
  db.prepare('DELETE FROM appointments WHERE id = ?').run(id);

export default { findByDate, findByMonth, findByWeek, findAll, findTomorrow, findByPatient, findById, create, update, updateStatus, remove };
