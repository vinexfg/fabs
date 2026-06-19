import { randomUUID } from 'crypto';
import { db } from '../database/connection';
import type { Treatment } from '../../types/entities';

export interface TreatmentInput {
  patientId: string;
  proc: string;
  dente?: string | null;
  valor?: number;
  status?: string;
  obs?: string | null;
}

const findByPatient = (patientId: string): Treatment[] =>
  db.prepare('SELECT * FROM treatments WHERE patientId = ? ORDER BY criadoEm').all(patientId) as unknown as Treatment[];

const findById = (id: string): Treatment | undefined =>
  db.prepare('SELECT * FROM treatments WHERE id = ?').get(id) as unknown as Treatment | undefined;

const create = ({ patientId, proc, dente, valor, status, obs }: TreatmentInput): Treatment | undefined => {
  const id = randomUUID();
  db.prepare('INSERT INTO treatments (id, patientId, proc, dente, valor, status, obs) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, patientId, proc, dente ?? null, valor || 0, status || 'pendente', obs ?? null);
  return findById(id);
};

const updateStatus = (id: string, status: string): Treatment | undefined => {
  db.prepare('UPDATE treatments SET status = ? WHERE id = ?').run(status, id);
  return findById(id);
};

const remove = (id: string) =>
  db.prepare('DELETE FROM treatments WHERE id = ?').run(id);

export default { findByPatient, findById, create, updateStatus, remove };
