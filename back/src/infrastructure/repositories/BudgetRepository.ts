import { randomUUID } from 'crypto';
import { db } from '../database/connection';
import type { Budget, BudgetItem } from '../../types/entities';

export interface BudgetInput {
  patientId: string;
  items?: BudgetItem[];
  desconto?: number;
  obs?: string;
  status?: string;
}

type BudgetRow = Omit<Budget, 'items'> & { items: string };

const findByPatient = (patientId: string): Budget[] =>
  (db.prepare('SELECT * FROM budgets WHERE patientId = ? ORDER BY criadoEm DESC').all(patientId) as BudgetRow[])
    .map(r => ({ ...r, items: JSON.parse(r.items || '[]') }));

const findById = (id: string): Budget | null => {
  const r = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id) as BudgetRow | undefined;
  if (!r) return null;
  return { ...r, items: JSON.parse(r.items || '[]') };
};

const create = ({ patientId, items = [], desconto = 0, obs = '', status = 'rascunho' }: BudgetInput): Budget | null => {
  const id = randomUUID();
  db.prepare('INSERT INTO budgets (id, patientId, items, desconto, obs, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, patientId, JSON.stringify(items), desconto, obs, status);
  return findById(id);
};

const update = (id: string, { items, desconto, obs, status }: BudgetInput): Budget | null => {
  db.prepare('UPDATE budgets SET items=?, desconto=?, obs=?, status=? WHERE id=?')
    .run(JSON.stringify(items || []), desconto ?? 0, obs ?? '', status ?? 'rascunho', id);
  return findById(id);
};

const updateStatus = (id: string, status: string): Budget | null => {
  db.prepare('UPDATE budgets SET status=? WHERE id=?').run(status, id);
  return findById(id);
};

const remove = (id: string) =>
  db.prepare('DELETE FROM budgets WHERE id = ?').run(id);

export default { findByPatient, findById, create, update, updateStatus, remove };
