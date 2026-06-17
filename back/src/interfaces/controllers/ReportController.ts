import type { Request, Response } from 'express';
import ReportRepository from '../../infrastructure/repositories/ReportRepository';

const stats = (req: Request, res: Response) => {
  const procedimentos   = ReportRepository.getTopProcedures();
  const agendaPorMes    = ReportRepository.getAgendaPorMes();
  const pacientesPorMes = ReportRepository.getPacientesPorMes();
  res.json({ procedimentos, agendaPorMes, pacientesPorMes });
};

export default { stats };
