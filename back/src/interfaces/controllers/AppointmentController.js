const appointmentRepository = require('../../infrastructure/repositories/AppointmentRepository');

const list = (req, res) => {
  const { date, month, week } = req.query;
  if (date)  return res.json(appointmentRepository.findByDate(date));
  if (month) return res.json(appointmentRepository.findByMonth(month));
  if (week)  return res.json(appointmentRepository.findByWeek(week));
  res.json(appointmentRepository.findAll());
};

const listTomorrow = (req, res) => {
  res.json(appointmentRepository.findTomorrow());
};

const listByPatient = (req, res) => {
  res.json(appointmentRepository.findByPatient(req.params.patientId));
};

const create = (req, res) => {
  if (!req.body.patientId || !req.body.date || !req.body.time) {
    return res.status(400).json({ error: 'patientId, date e time são obrigatórios' });
  }
  res.json(appointmentRepository.create(req.body));
};

const update = (req, res) => {
  res.json(appointmentRepository.update(req.params.id, req.body));
};

const updateStatus = (req, res) => {
  res.json(appointmentRepository.updateStatus(req.params.id, req.body.status));
};

const remove = (req, res) => {
  appointmentRepository.remove(req.params.id);
  res.json({ ok: true });
};

module.exports = { list, listTomorrow, listByPatient, create, update, updateStatus, remove };
