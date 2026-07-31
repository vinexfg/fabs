import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initializeSchema } from '../../database/schema';
import paymentRepository from '../PaymentRepository';
import { resetDb, insertPatient, insertTreatment, insertPayment } from '../../../test/dbHelpers';

beforeAll(() => { initializeSchema(); });
beforeEach(() => { resetDb(); });

describe('PaymentRepository.findInadimplencia', () => {
  it('lista só pacientes com saldo em aberto (tratamentos > pagamentos)', () => {
    const devedor = insertPatient({ nome: 'Devedor' });
    insertTreatment(devedor, 1000);
    insertPayment(devedor, 400);

    const emDia = insertPatient({ nome: 'Em Dia' });
    insertTreatment(emDia, 500);
    insertPayment(emDia, 500);

    const result = paymentRepository.findInadimplencia();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(devedor);
    expect(result[0].totalTrat).toBe(1000);
    expect(result[0].totalPago).toBe(400);
    expect(result[0].emAberto).toBe(600);
  });

  it('não lista paciente que pagou a mais do que deve', () => {
    const patientId = insertPatient();
    insertTreatment(patientId, 200);
    insertPayment(patientId, 300);

    expect(paymentRepository.findInadimplencia()).toHaveLength(0);
  });

  it('trata paciente sem nenhum pagamento como totalmente em aberto', () => {
    const patientId = insertPatient();
    insertTreatment(patientId, 350);

    const result = paymentRepository.findInadimplencia();
    expect(result).toHaveLength(1);
    expect(result[0].totalPago).toBe(0);
    expect(result[0].emAberto).toBe(350);
  });

  it('ordena por valor em aberto decrescente', () => {
    const menorDivida = insertPatient({ nome: 'Menor Dívida' });
    insertTreatment(menorDivida, 100);

    const maiorDivida = insertPatient({ nome: 'Maior Dívida' });
    insertTreatment(maiorDivida, 900);

    const result = paymentRepository.findInadimplencia();
    expect(result.map(r => r.id)).toEqual([maiorDivida, menorDivida]);
  });
});
