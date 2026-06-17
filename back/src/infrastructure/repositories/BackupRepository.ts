import { db } from '../database/connection';
import type {
  Patient, Treatment, Payment, Evolution, Appointment, OdontogramaTooth, Template, Budget,
} from '../../types/entities';

interface BackupData {
  version: string;
  exportedAt: string;
  patients: Patient[];
  treatments: Treatment[];
  payments: Payment[];
  evolutions: Evolution[];
  appointments: Appointment[];
  odontograma: OdontogramaTooth[];
  templates: Template[];
  budgets: (Omit<Budget, 'items'> & { items: string })[];
}

type RestoreInput = Partial<{
  patients: Patient[];
  treatments: Treatment[];
  payments: Payment[];
  evolutions: Evolution[];
  appointments: Appointment[];
  odontograma: OdontogramaTooth[];
  templates: Template[];
  budgets: (Omit<Budget, 'items'> & { items: string })[];
}>;

const exportAll = (): BackupData => ({
  version: '2.0',
  exportedAt: new Date().toISOString(),
  patients:     db.prepare('SELECT * FROM patients').all() as Patient[],
  treatments:   db.prepare('SELECT * FROM treatments').all() as Treatment[],
  payments:     db.prepare('SELECT * FROM payments').all() as Payment[],
  evolutions:   db.prepare('SELECT * FROM evolutions').all() as Evolution[],
  appointments: db.prepare('SELECT * FROM appointments').all() as Appointment[],
  odontograma:  db.prepare('SELECT * FROM odontograma').all() as OdontogramaTooth[],
  templates:    db.prepare('SELECT * FROM templates').all() as Template[],
  budgets:      db.prepare('SELECT * FROM budgets').all() as (Omit<Budget, 'items'> & { items: string })[],
});

const restore = ({ patients = [], treatments = [], payments = [], evolutions = [], appointments = [], odontograma = [], templates = [], budgets = [] }: RestoreInput) => {
  db.exec('BEGIN TRANSACTION');
  try {
    db.exec('DELETE FROM budgets');
    db.exec('DELETE FROM odontograma');
    db.exec('DELETE FROM appointments');
    db.exec('DELETE FROM evolutions');
    db.exec('DELETE FROM payments');
    db.exec('DELETE FROM treatments');
    db.exec('DELETE FROM patients');
    db.exec('DELETE FROM templates');

    const insertPatient     = db.prepare('INSERT OR IGNORE INTO patients (id,nome,dataNascimento,cpf,telefone,email,endereco,convenio,alergias,medicamentos,conds,queixa,foto,anamnese,criadoEm) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const insertTreatment   = db.prepare('INSERT OR IGNORE INTO treatments (id,patientId,proc,dente,valor,status,obs,criadoEm) VALUES (?,?,?,?,?,?,?,?)');
    const insertPayment     = db.prepare('INSERT OR IGNORE INTO payments (id,patientId,descricao,valor,data,forma,criadoEm) VALUES (?,?,?,?,?,?,?)');
    const insertEvolution   = db.prepare('INSERT OR IGNORE INTO evolutions (id,patientId,proc,data,hora,notas,proxConsulta,criadoEm) VALUES (?,?,?,?,?,?,?,?)');
    const insertAppointment = db.prepare('INSERT OR IGNORE INTO appointments (id,patientId,date,time,duration,type,status,notes,criadoEm) VALUES (?,?,?,?,?,?,?,?,?)');
    const insertOdontograma = db.prepare('INSERT OR IGNORE INTO odontograma (id,patientId,tooth,status,notes) VALUES (?,?,?,?,?)');
    const insertTemplate    = db.prepare('INSERT OR IGNORE INTO templates (id,name,valor,obs) VALUES (?,?,?,?)');
    const insertBudget      = db.prepare('INSERT OR IGNORE INTO budgets (id,patientId,items,desconto,obs,status,criadoEm) VALUES (?,?,?,?,?,?,?)');

    patients.forEach(p     => insertPatient.run(p.id, p.nome, p.dataNascimento, p.cpf, p.telefone, p.email, p.endereco, p.convenio, p.alergias, p.medicamentos, p.conds, p.queixa, p.foto, p.anamnese ?? null, p.criadoEm));
    treatments.forEach(t   => insertTreatment.run(t.id, t.patientId, t.proc, t.dente, t.valor, t.status, t.obs, t.criadoEm));
    payments.forEach(p     => insertPayment.run(p.id, p.patientId, p.descricao, p.valor, p.data, p.forma, p.criadoEm));
    evolutions.forEach(e   => insertEvolution.run(e.id, e.patientId, e.proc, e.data, e.hora, e.notas, e.proxConsulta, e.criadoEm));
    appointments.forEach(a => insertAppointment.run(a.id, a.patientId, a.date, a.time, a.duration, a.type, a.status, a.notes, a.criadoEm));
    odontograma.forEach(o  => insertOdontograma.run(o.id, o.patientId, o.tooth, o.status, o.notes));
    templates.forEach(t    => insertTemplate.run(t.id, t.name, t.valor, t.obs));
    budgets.forEach(b      => insertBudget.run(b.id, b.patientId, b.items, b.desconto, b.obs, b.status, b.criadoEm));

    db.exec('COMMIT');
    return { patients: patients.length, treatments: treatments.length, budgets: budgets.length };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

export default { exportAll, restore };
