import { randomUUID } from 'crypto';
import { db } from '../database/connection';
import type { OdontogramaTooth } from '../../types/entities';

export interface ToothUpdateInput {
  status: string;
  notes?: string | null;
}

export interface ToothCreateInput {
  tooth: string;
  status: string;
  notes?: string | null;
}

const findByPatient = (patientId: string): OdontogramaTooth[] =>
  db.prepare('SELECT * FROM odontograma WHERE patientId = ?').all(patientId) as OdontogramaTooth[];

const findById = (id: string): OdontogramaTooth | undefined =>
  db.prepare('SELECT * FROM odontograma WHERE id = ?').get(id) as OdontogramaTooth | undefined;

const findByPatientAndTooth = (patientId: string, tooth: string): { id: string } | undefined =>
  db.prepare('SELECT id FROM odontograma WHERE patientId = ? AND tooth = ?').get(patientId, tooth) as { id: string } | undefined;

const updateTooth = (id: string, { status, notes }: ToothUpdateInput): OdontogramaTooth | undefined => {
  db.prepare("UPDATE odontograma SET status=?, notes=?, updatedAt=datetime('now') WHERE id=?")
    .run(status, notes || null, id);
  return findById(id);
};

const createTooth = (patientId: string, { tooth, status, notes }: ToothCreateInput): OdontogramaTooth | undefined => {
  const id = randomUUID();
  db.prepare('INSERT INTO odontograma (id, patientId, tooth, status, notes) VALUES (?, ?, ?, ?, ?)')
    .run(id, patientId, tooth, status, notes || null);
  return findById(id);
};

export default { findByPatient, findByPatientAndTooth, updateTooth, createTooth };
