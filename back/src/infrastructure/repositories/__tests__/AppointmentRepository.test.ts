import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from '../../database/schema';
import appointmentRepository from '../AppointmentRepository';
import { resetDb, insertPatient, insertAppointment } from '../../../test/dbHelpers';

beforeAll(() => { initializeSchema(); });
beforeEach(() => { resetDb(); });

describe('AppointmentRepository.findByDate', () => {
  it('retorna só as consultas da data pedida, ordenadas por horário', () => {
    const patientId = insertPatient();
    insertAppointment(patientId, '2026-03-10', '14:00');
    insertAppointment(patientId, '2026-03-10', '09:00');
    insertAppointment(patientId, '2026-03-11', '10:00');

    const result = appointmentRepository.findByDate('2026-03-10');
    expect(result).toHaveLength(2);
    expect(result.map(a => a.time)).toEqual(['09:00', '14:00']);
  });
});

describe('AppointmentRepository.findByMonth', () => {
  it('casa só o mês pedido, sem pegar meses com prefixo parecido', () => {
    const patientId = insertPatient();
    insertAppointment(patientId, '2026-01-15', '10:00');
    insertAppointment(patientId, '2026-01-31', '10:00');
    insertAppointment(patientId, '2026-10-05', '10:00'); // não deveria casar com o filtro '2026-01'

    const result = appointmentRepository.findByMonth('2026-01');
    expect(result).toHaveLength(2);
  });
});

describe('AppointmentRepository.findByWeek', () => {
  it('inclui a data inicial e os 6 dias seguintes, exclui o 7º dia', () => {
    const patientId = insertPatient();
    insertAppointment(patientId, '2026-03-01', '08:00'); // dia 0 (início)
    insertAppointment(patientId, '2026-03-07', '08:00'); // dia 6 (último dia da semana)
    insertAppointment(patientId, '2026-03-08', '08:00'); // dia 7 (deveria ficar de fora)

    const result = appointmentRepository.findByWeek('2026-03-01');
    expect(result.map(a => a.date)).toEqual(['2026-03-01', '2026-03-07']);
  });
});

describe('AppointmentRepository.findTomorrow', () => {
  it('retorna só consultas agendadas de amanhã, sem canceladas nem de outros dias', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    const patientId = insertPatient();
    insertAppointment(patientId, tomorrowStr, '09:00', { status: 'agendado' });
    insertAppointment(patientId, tomorrowStr, '10:00', { status: 'cancelado' });
    insertAppointment(patientId, dayAfterStr, '09:00', { status: 'agendado' });

    const result = appointmentRepository.findTomorrow();
    expect(result).toHaveLength(1);
    expect(result[0].time).toBe('09:00');
    expect(result[0].status).toBe('agendado');
  });
});
