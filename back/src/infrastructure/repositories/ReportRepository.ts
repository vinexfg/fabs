import { db } from '../database/connection';

interface TopProcedure {
  proc: string;
  count: number;
  total: number;
  avg: number;
}

interface AgendaPorMes {
  mes: string;
  total: number;
  realizados: number;
  cancelados: number;
  faltou: number;
  agendados: number;
}

interface PacientesPorMes {
  mes: string;
  novos: number;
}

const getTopProcedures = (): TopProcedure[] =>
  db.prepare(`
    SELECT
      proc,
      COUNT(*)     AS count,
      SUM(valor)   AS total,
      AVG(valor)   AS avg
    FROM treatments
    WHERE proc IS NOT NULL AND proc != ''
    GROUP BY proc
    ORDER BY count DESC
    LIMIT 20
  `).all() as unknown as TopProcedure[];

const getAgendaPorMes = (): AgendaPorMes[] =>
  db.prepare(`
    SELECT
      substr(date, 1, 7)                                              AS mes,
      COUNT(*)                                                        AS total,
      SUM(CASE WHEN status = 'realizado' THEN 1 ELSE 0 END)          AS realizados,
      SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END)          AS cancelados,
      SUM(CASE WHEN status = 'faltou'    THEN 1 ELSE 0 END)          AS faltou,
      SUM(CASE WHEN status = 'agendado'  THEN 1 ELSE 0 END)          AS agendados
    FROM appointments
    WHERE date IS NOT NULL AND date != ''
    GROUP BY mes
    ORDER BY mes
  `).all() as unknown as AgendaPorMes[];

const getPacientesPorMes = (): PacientesPorMes[] =>
  db.prepare(`
    SELECT substr(criadoEm, 1, 7) AS mes, COUNT(*) AS novos
    FROM patients
    WHERE criadoEm IS NOT NULL
    GROUP BY mes
    ORDER BY mes
  `).all() as unknown as PacientesPorMes[];

export default { getTopProcedures, getAgendaPorMes, getPacientesPorMes };
