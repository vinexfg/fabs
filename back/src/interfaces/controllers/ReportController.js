const ReportRepository = require('../../infrastructure/repositories/ReportRepository');

const stats = (req, res) => {
  const procedimentos   = ReportRepository.getTopProcedures();
  const agendaPorMes    = ReportRepository.getAgendaPorMes();
  const pacientesPorMes = ReportRepository.getPacientesPorMes();
  res.json({ procedimentos, agendaPorMes, pacientesPorMes });
};

module.exports = { stats };
