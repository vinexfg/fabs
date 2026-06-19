import { randomUUID } from 'crypto';
import { db } from '../database/connection';
import type { Template } from '../../types/entities';

export interface TemplateInput {
  name: string;
  valor?: number;
  obs?: string | null;
}

const findAll = (): Template[] =>
  db.prepare('SELECT * FROM templates ORDER BY name').all() as unknown as Template[];

const findById = (id: string): Template | undefined =>
  db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as unknown as Template | undefined;

const create = ({ name, valor, obs }: TemplateInput): Template | undefined => {
  const id = randomUUID();
  db.prepare('INSERT INTO templates (id, name, valor, obs) VALUES (?, ?, ?, ?)').run(id, name, valor || 0, obs ?? null);
  return findById(id);
};

const remove = (id: string) =>
  db.prepare('DELETE FROM templates WHERE id = ?').run(id);

export default { findAll, findById, create, remove };
