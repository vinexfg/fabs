import { randomUUID } from 'crypto';
import { db } from '../infrastructure/database/connection';

export function resetDb(): void {
  db.exec(`
    DELETE FROM budgets;
    DELETE FROM odontograma;
    DELETE FROM appointments;
    DELETE FROM evolutions;
    DELETE FROM payments;
    DELETE FROM treatments;
    DELETE FROM patients;
  `);
}

export function insertPatient(overrides: Partial<{
  id: string; nome: string; telefone: string | null; convenio: string | null; criadoEm: string;
}> = {}): string {
  const id = overrides.id ?? randomUUID();
  const nome = overrides.nome ?? 'Paciente Teste';
  const telefone = overrides.telefone ?? null;
  const convenio = overrides.convenio ?? null;

  if (overrides.criadoEm) {
    db.prepare('INSERT INTO patients (id, nome, telefone, convenio, criadoEm) VALUES (?, ?, ?, ?, ?)')
      .run(id, nome, telefone, convenio, overrides.criadoEm);
  } else {
    db.prepare('INSERT INTO patients (id, nome, telefone, convenio) VALUES (?, ?, ?, ?)')
      .run(id, nome, telefone, convenio);
  }
  return id;
}

export function insertTreatment(patientId: string, valor: number, overrides: Partial<{ proc: string; status: string }> = {}): string {
  const id = randomUUID();
  db.prepare('INSERT INTO treatments (id, patientId, proc, valor, status) VALUES (?, ?, ?, ?, ?)')
    .run(id, patientId, overrides.proc ?? 'Procedimento', valor, overrides.status ?? 'pendente');
  return id;
}

export function insertPayment(patientId: string, valor: number, overrides: Partial<{ data: string; descricao: string }> = {}): string {
  const id = randomUUID();
  db.prepare('INSERT INTO payments (id, patientId, descricao, valor, data) VALUES (?, ?, ?, ?, ?)')
    .run(id, patientId, overrides.descricao ?? 'Pagamento', valor, overrides.data ?? null);
  return id;
}

export function insertAppointment(patientId: string, date: string, time: string, overrides: Partial<{ status: string; duration: number }> = {}): string {
  const id = randomUUID();
  db.prepare('INSERT INTO appointments (id, patientId, date, time, status, duration) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, patientId, date, time, overrides.status ?? 'agendado', overrides.duration ?? 60);
  return id;
}
