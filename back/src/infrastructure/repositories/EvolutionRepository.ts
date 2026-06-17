import { randomUUID } from 'crypto';
import { db } from '../database/connection';
import type { Evolution } from '../../types/entities';

export interface EvolutionInput {
  patientId: string;
  proc: string;
  data?: string | null;
  hora?: string | null;
  notas?: string | null;
  proxConsulta?: string | null;
}

const findByPatient = (patientId: string): Evolution[] =>
  db.prepare('SELECT * FROM evolutions WHERE patientId = ? ORDER BY data DESC, hora DESC').all(patientId) as Evolution[];

const findById = (id: string): Evolution | undefined =>
  db.prepare('SELECT * FROM evolutions WHERE id = ?').get(id) as Evolution | undefined;

const create = ({ patientId, proc, data, hora, notas, proxConsulta }: EvolutionInput): Evolution | undefined => {
  const id = randomUUID();
  db.prepare('INSERT INTO evolutions (id, patientId, proc, data, hora, notas, proxConsulta) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, patientId, proc, data ?? null, hora ?? null, notas ?? null, proxConsulta ?? null);
  return findById(id);
};

const update = (id: string, { proc, data, hora, notas, proxConsulta }: EvolutionInput): Evolution | undefined => {
  db.prepare('UPDATE evolutions SET proc=?, data=?, hora=?, notas=?, proxConsulta=? WHERE id=?')
    .run(proc, data ?? null, hora ?? null, notas ?? null, proxConsulta ?? null, id);
  return findById(id);
};

const remove = (id: string) =>
  db.prepare('DELETE FROM evolutions WHERE id = ?').run(id);

export default { findByPatient, findById, create, update, remove };
