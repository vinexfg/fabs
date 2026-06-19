import { randomUUID } from 'crypto';
import { db } from '../database/connection';
import type { Payment } from '../../types/entities';

export interface PaymentInput {
  patientId: string;
  descricao: string;
  valor: number;
  data?: string | null;
  forma?: string | null;
}

type PaymentWithPatient = Payment & { patientNome: string };

interface Inadimplente {
  id: string;
  nome: string;
  telefone: string | null;
  convenio: string | null;
  totalTrat: number;
  totalPago: number;
}

const findAll = (): PaymentWithPatient[] =>
  db.prepare(`
    SELECT py.*, p.nome as patientNome
    FROM payments py JOIN patients p ON p.id = py.patientId
    ORDER BY py.data DESC
  `).all() as unknown as PaymentWithPatient[];

const findByPatient = (patientId: string): Payment[] =>
  db.prepare('SELECT * FROM payments WHERE patientId = ? ORDER BY data DESC').all(patientId) as unknown as Payment[];

const findById = (id: string): Payment | undefined =>
  db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as unknown as Payment | undefined;

const findInadimplencia = (): (Inadimplente & { emAberto: number })[] => {
  const rows = db.prepare(`
    SELECT
      p.id, p.nome, p.telefone, p.convenio,
      COALESCE((SELECT SUM(valor) FROM treatments WHERE patientId = p.id), 0) as totalTrat,
      COALESCE((SELECT SUM(valor) FROM payments   WHERE patientId = p.id), 0) as totalPago
    FROM patients p
    WHERE (
      COALESCE((SELECT SUM(valor) FROM treatments WHERE patientId = p.id), 0) -
      COALESCE((SELECT SUM(valor) FROM payments   WHERE patientId = p.id), 0)
    ) > 0
    ORDER BY (
      COALESCE((SELECT SUM(valor) FROM treatments WHERE patientId = p.id), 0) -
      COALESCE((SELECT SUM(valor) FROM payments   WHERE patientId = p.id), 0)
    ) DESC
  `).all() as unknown as Inadimplente[];
  return rows.map((row) => ({ ...row, emAberto: row.totalTrat - row.totalPago }));
};

const create = ({ patientId, descricao, valor, data, forma }: PaymentInput): Payment | undefined => {
  const id = randomUUID();
  db.prepare('INSERT INTO payments (id, patientId, descricao, valor, data, forma) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, patientId, descricao, valor, data ?? null, forma ?? null);
  return findById(id);
};

const update = (id: string, { descricao, valor, data, forma }: PaymentInput): Payment | undefined => {
  db.prepare('UPDATE payments SET descricao=?, valor=?, data=?, forma=? WHERE id=?')
    .run(descricao, valor, data ?? null, forma ?? null, id);
  return findById(id);
};

const remove = (id: string) =>
  db.prepare('DELETE FROM payments WHERE id = ?').run(id);

export default { findAll, findByPatient, findById, findInadimplencia, create, update, remove };
