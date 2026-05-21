const { db } = require('../database/connection');

const exportAll = () => ({
  version: '1.0',
  exportedAt: new Date().toISOString(),
  patients:     db.prepare('SELECT * FROM patients').all(),
  treatments:   db.prepare('SELECT * FROM treatments').all(),
  payments:     db.prepare('SELECT * FROM payments').all(),
  evolutions:   db.prepare('SELECT * FROM evolutions').all(),
  appointments: db.prepare('SELECT * FROM appointments').all(),
  odontograma:  db.prepare('SELECT * FROM odontograma').all(),
  templates:    db.prepare('SELECT * FROM templates').all(),
});

const restore = ({ patients = [], treatments = [], payments = [], evolutions = [], appointments = [], odontograma = [], templates = [] }) => {
  db.exec('BEGIN TRANSACTION');
  try {
    db.exec('DELETE FROM odontograma');
    db.exec('DELETE FROM appointments');
    db.exec('DELETE FROM evolutions');
    db.exec('DELETE FROM payments');
    db.exec('DELETE FROM treatments');
    db.exec('DELETE FROM patients');
    db.exec('DELETE FROM templates');

    const insertPatient     = db.prepare('INSERT OR IGNORE INTO patients (id,nome,dataNascimento,cpf,telefone,email,endereco,convenio,alergias,medicamentos,conds,queixa,foto,criadoEm) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const insertTreatment   = db.prepare('INSERT OR IGNORE INTO treatments (id,patientId,proc,dente,valor,status,obs,criadoEm) VALUES (?,?,?,?,?,?,?,?)');
    const insertPayment     = db.prepare('INSERT OR IGNORE INTO payments (id,patientId,descricao,valor,data,forma,criadoEm) VALUES (?,?,?,?,?,?,?)');
    const insertEvolution   = db.prepare('INSERT OR IGNORE INTO evolutions (id,patientId,proc,data,hora,notas,proxConsulta,criadoEm) VALUES (?,?,?,?,?,?,?,?)');
    const insertAppointment = db.prepare('INSERT OR IGNORE INTO appointments (id,patientId,date,time,duration,type,status,notes,criadoEm) VALUES (?,?,?,?,?,?,?,?,?)');
    const insertOdontograma = db.prepare('INSERT OR IGNORE INTO odontograma (id,patientId,tooth,status,notes) VALUES (?,?,?,?,?)');
    const insertTemplate    = db.prepare('INSERT OR IGNORE INTO templates (id,name,valor,obs) VALUES (?,?,?,?)');

    patients.forEach((patient) => insertPatient.run(patient.id, patient.nome, patient.dataNascimento, patient.cpf, patient.telefone, patient.email, patient.endereco, patient.convenio, patient.alergias, patient.medicamentos, patient.conds, patient.queixa, patient.foto, patient.criadoEm));
    treatments.forEach((treatment) => insertTreatment.run(treatment.id, treatment.patientId, treatment.proc, treatment.dente, treatment.valor, treatment.status, treatment.obs, treatment.criadoEm));
    payments.forEach((payment) => insertPayment.run(payment.id, payment.patientId, payment.descricao, payment.valor, payment.data, payment.forma, payment.criadoEm));
    evolutions.forEach((evolution) => insertEvolution.run(evolution.id, evolution.patientId, evolution.proc, evolution.data, evolution.hora, evolution.notas, evolution.proxConsulta, evolution.criadoEm));
    appointments.forEach((appointment) => insertAppointment.run(appointment.id, appointment.patientId, appointment.date, appointment.time, appointment.duration, appointment.type, appointment.status, appointment.notes, appointment.criadoEm));
    odontograma.forEach((tooth) => insertOdontograma.run(tooth.id, tooth.patientId, tooth.tooth, tooth.status, tooth.notes));
    templates.forEach((template) => insertTemplate.run(template.id, template.name, template.valor, template.obs));

    db.exec('COMMIT');
    return { patients: patients.length, treatments: treatments.length };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

module.exports = { exportAll, restore };
