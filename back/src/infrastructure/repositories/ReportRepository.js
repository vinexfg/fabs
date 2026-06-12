const { db } = require('../database/connection');

const getTopProcedures = () =>
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
  `).all();

const getAgendaPorMes = () =>
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
  `).all();

const getPacientesPorMes = () =>
  db.prepare(`
    SELECT substr(criadoEm, 1, 7) AS mes, COUNT(*) AS novos
    FROM patients
    WHERE criadoEm IS NOT NULL
    GROUP BY mes
    ORDER BY mes
  `).all();

module.exports = { getTopProcedures, getAgendaPorMes, getPacientesPorMes };
