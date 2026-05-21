const router = require('express').Router();
const { db } = require('../db');

router.get('/', (req, res) => {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    patients:     db.prepare('SELECT * FROM patients').all(),
    treatments:   db.prepare('SELECT * FROM treatments').all(),
    payments:     db.prepare('SELECT * FROM payments').all(),
    evolutions:   db.prepare('SELECT * FROM evolutions').all(),
    appointments: db.prepare('SELECT * FROM appointments').all(),
    odontograma:  db.prepare('SELECT * FROM odontograma').all(),
    templates:    db.prepare('SELECT * FROM templates').all(),
  };
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Disposition', `attachment; filename="backup-dentefacil-${date}.json"`);
  res.json(data);
});

router.post('/restore', (req, res) => {
  const { patients = [], treatments = [], payments = [], evolutions = [],
          appointments = [], odontograma = [], templates = [] } = req.body;

  db.exec('BEGIN TRANSACTION');
  try {
    db.exec('DELETE FROM odontograma');
    db.exec('DELETE FROM appointments');
    db.exec('DELETE FROM evolutions');
    db.exec('DELETE FROM payments');
    db.exec('DELETE FROM treatments');
    db.exec('DELETE FROM patients');
    db.exec('DELETE FROM templates');

    const ins = {
      patients:     db.prepare('INSERT OR IGNORE INTO patients (id,nome,dataNascimento,cpf,telefone,email,endereco,convenio,alergias,medicamentos,conds,queixa,foto,criadoEm) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'),
      treatments:   db.prepare('INSERT OR IGNORE INTO treatments (id,patientId,proc,dente,valor,status,obs,criadoEm) VALUES (?,?,?,?,?,?,?,?)'),
      payments:     db.prepare('INSERT OR IGNORE INTO payments (id,patientId,descricao,valor,data,forma,criadoEm) VALUES (?,?,?,?,?,?,?)'),
      evolutions:   db.prepare('INSERT OR IGNORE INTO evolutions (id,patientId,proc,data,hora,notas,proxConsulta,criadoEm) VALUES (?,?,?,?,?,?,?,?)'),
      appointments: db.prepare('INSERT OR IGNORE INTO appointments (id,patientId,date,time,duration,type,status,notes,criadoEm) VALUES (?,?,?,?,?,?,?,?,?)'),
      odontograma:  db.prepare('INSERT OR IGNORE INTO odontograma (id,patientId,tooth,status,notes) VALUES (?,?,?,?,?)'),
      templates:    db.prepare('INSERT OR IGNORE INTO templates (id,name,valor,obs) VALUES (?,?,?,?)'),
    };

    patients.forEach(p => ins.patients.run(p.id,p.nome,p.dataNascimento,p.cpf,p.telefone,p.email,p.endereco,p.convenio,p.alergias,p.medicamentos,p.conds,p.queixa,p.foto,p.criadoEm));
    treatments.forEach(t => ins.treatments.run(t.id,t.patientId,t.proc,t.dente,t.valor,t.status,t.obs,t.criadoEm));
    payments.forEach(p => ins.payments.run(p.id,p.patientId,p.descricao,p.valor,p.data,p.forma,p.criadoEm));
    evolutions.forEach(e => ins.evolutions.run(e.id,e.patientId,e.proc,e.data,e.hora,e.notas,e.proxConsulta,e.criadoEm));
    appointments.forEach(a => ins.appointments.run(a.id,a.patientId,a.date,a.time,a.duration,a.type,a.status,a.notes,a.criadoEm));
    odontograma.forEach(o => ins.odontograma.run(o.id,o.patientId,o.tooth,o.status,o.notes));
    templates.forEach(t => ins.templates.run(t.id,t.name,t.valor,t.obs));

    db.exec('COMMIT');
    res.json({ ok: true, restored: { patients: patients.length, treatments: treatments.length } });
  } catch (e) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
