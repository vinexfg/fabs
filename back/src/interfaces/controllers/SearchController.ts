import type { Request, Response } from 'express';
import { db } from '../../infrastructure/database/connection';

interface PatientResult {
  id: string;
  nome: string;
  telefone: string | null;
  cpf: string | null;
  convenio: string | null;
}

interface EvolutionResult {
  id: string;
  proc: string;
  data: string | null;
  notas: string | null;
  patientId: string;
  patientNome: string;
}

interface AppointmentResult {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  patientId: string;
  patientNome: string;
}

const search = (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim();
  if (!q || q.length < 2) return res.json({ patients: [], evolutions: [], appointments: [] });

  const like = `%${q}%`;

  const patients = db.prepare(`
    SELECT id, nome, telefone, cpf, convenio
    FROM patients
    WHERE nome LIKE ? OR telefone LIKE ? OR cpf LIKE ?
    ORDER BY nome LIMIT 5
  `).all(like, like, like) as unknown as PatientResult[];

  const evolutions = db.prepare(`
    SELECT e.id, e.proc, e.data, e.notas, e.patientId, p.nome as patientNome
    FROM evolutions e
    JOIN patients p ON p.id = e.patientId
    WHERE e.proc LIKE ? OR e.notas LIKE ?
    ORDER BY e.data DESC LIMIT 5
  `).all(like, like) as unknown as EvolutionResult[];

  const appointments = db.prepare(`
    SELECT a.id, a.date, a.time, a.type, a.status, a.patientId, p.nome as patientNome
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    WHERE p.nome LIKE ? OR a.type LIKE ? OR a.notes LIKE ?
    ORDER BY a.date DESC LIMIT 5
  `).all(like, like, like) as unknown as AppointmentResult[];

  res.json({ patients, evolutions, appointments });
};

export default { search };
