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
  db.prepare('SELECT * FROM evolutions WHERE patientId = ? ORDER BY data DESC, hora DESC').all(patientId) as unknown as Evolution[];

const findById = (id: string): Evolution | undefined =>
  db.prepare('SELECT * FROM evolutions WHERE id = ?').get(id) as unknown as Evolution | undefined;

export interface EvolutionSearchResult {
  id: string;
  proc: string;
  data: string | null;
  notas: string | null;
  patientId: string;
  patientNome: string;
}

const search = (q: string): EvolutionSearchResult[] => {
  const like = `%${q}%`;
  return db.prepare(`
    SELECT e.id, e.proc, e.data, e.notas, e.patientId, p.nome as patientNome
    FROM evolutions e
    JOIN patients p ON p.id = e.patientId
    WHERE e.proc LIKE ? OR e.notas LIKE ?
    ORDER BY e.data DESC LIMIT 5
  `).all(like, like) as unknown as EvolutionSearchResult[];
};

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

export default { findByPatient, findById, search, create, update, remove };
