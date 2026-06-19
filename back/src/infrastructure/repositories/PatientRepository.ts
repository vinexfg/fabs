import { randomUUID } from 'crypto';
import { db } from '../database/connection';
import type { Patient } from '../../types/entities';

export interface PatientInput {
  nome: string;
  dataNascimento?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  convenio?: string | null;
  alergias?: string | null;
  medicamentos?: string | null;
  conds?: string | null;
  queixa?: string | null;
  foto?: string | null;
  anamnese?: string | null;
}

export interface PaginatedPatients {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
}

const findAll = (): Patient[] =>
  db.prepare('SELECT * FROM patients ORDER BY nome').all() as unknown as Patient[];

const findPaginated = ({ q = '', page = 1, limit = 15 } = {}): PaginatedPatients => {
  const offset = (Number(page) - 1) * Number(limit);
  const like = `%${q}%`;
  const where = q
    ? 'WHERE nome LIKE ? OR telefone LIKE ? OR cpf LIKE ? OR convenio LIKE ?'
    : '';
  const params = q ? [like, like, like, like] : [];
  const rows  = db.prepare(`SELECT * FROM patients ${where} ORDER BY nome LIMIT ? OFFSET ?`).all(...params, Number(limit), offset) as unknown as Patient[];
  const { total } = db.prepare(`SELECT COUNT(*) as total FROM patients ${where}`).get(...params) as { total: number };
  return { patients: rows, total, page: Number(page), limit: Number(limit) };
};

const findById = (id: string): Patient | undefined =>
  db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as unknown as Patient | undefined;

const create = ({ nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto, anamnese }: PatientInput): Patient | undefined => {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO patients (id, nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto, anamnese)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, nome, dataNascimento ?? null, cpf ?? null, telefone ?? null, email ?? null, endereco ?? null, convenio ?? null, alergias ?? null, medicamentos ?? null, conds ?? null, queixa ?? null, foto || null, anamnese || null);
  return findById(id);
};

const update = (id: string, { nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto, anamnese }: PatientInput): Patient | undefined => {
  db.prepare(`
    UPDATE patients SET nome=?, dataNascimento=?, cpf=?, telefone=?, email=?, endereco=?, convenio=?, alergias=?, medicamentos=?, conds=?, queixa=?, foto=?, anamnese=?
    WHERE id=?
  `).run(nome, dataNascimento ?? null, cpf ?? null, telefone ?? null, email ?? null, endereco ?? null, convenio ?? null, alergias ?? null, medicamentos ?? null, conds ?? null, queixa ?? null, foto || null, anamnese || null, id);
  return findById(id);
};

const remove = (id: string): void => {
  db.prepare('DELETE FROM evolutions WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM payments WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM treatments WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM appointments WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM odontograma WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM budgets WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM patients WHERE id = ?').run(id);
};

export default { findAll, findPaginated, findById, create, update, remove };
