import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from '../../database/schema';
import reportRepository from '../ReportRepository';
import { resetDb, insertPatient, insertTreatment, insertAppointment } from '../../../test/dbHelpers';

beforeAll(() => { initializeSchema(); });
beforeEach(() => { resetDb(); });

describe('ReportRepository.getTopProcedures', () => {
  it('agrega count/total/média por procedimento, ordenado por count desc', () => {
    const patientId = insertPatient();
    insertTreatment(patientId, 100, { proc: 'Limpeza' });
    insertTreatment(patientId, 150, { proc: 'Limpeza' });
    insertTreatment(patientId, 900, { proc: 'Implante' });

    const result = reportRepository.getTopProcedures();

    const limpeza = result.find(p => p.proc === 'Limpeza');
    expect(limpeza?.count).toBe(2);
    expect(limpeza?.total).toBe(250);
    expect(limpeza?.avg).toBeCloseTo(125);
    expect(result[0].proc).toBe('Limpeza');
  });

  it('ignora tratamentos sem nome de procedimento', () => {
    const patientId = insertPatient();
    insertTreatment(patientId, 100, { proc: '' });

    expect(reportRepository.getTopProcedures()).toHaveLength(0);
  });
});

describe('ReportRepository.getAgendaPorMes', () => {
  it('agrupa consultas por mês e status', () => {
    const patientId = insertPatient();
    insertAppointment(patientId, '2026-02-01', '09:00', { status: 'realizado' });
    insertAppointment(patientId, '2026-02-02', '09:00', { status: 'faltou' });
    insertAppointment(patientId, '2026-02-03', '09:00', { status: 'cancelado' });
    insertAppointment(patientId, '2026-03-01', '09:00', { status: 'agendado' });

    const result = reportRepository.getAgendaPorMes();

    const fev = result.find(m => m.mes === '2026-02');
    expect(fev).toMatchObject({ total: 3, realizados: 1, faltou: 1, cancelados: 1, agendados: 0 });

    const mar = result.find(m => m.mes === '2026-03');
    expect(mar).toMatchObject({ total: 1, agendados: 1 });
  });
});

describe('ReportRepository.getPacientesPorMes', () => {
  it('agrupa novos pacientes por mês de cadastro', () => {
    insertPatient({ criadoEm: '2026-01-05T10:00:00' });
    insertPatient({ criadoEm: '2026-01-20T10:00:00' });
    insertPatient({ criadoEm: '2026-02-01T10:00:00' });

    const result = reportRepository.getPacientesPorMes();
    expect(result.find(m => m.mes === '2026-01')?.novos).toBe(2);
    expect(result.find(m => m.mes === '2026-02')?.novos).toBe(1);
  });
});
