import type { Request, Response } from 'express';
import patientRepository from '../../infrastructure/repositories/PatientRepository';
import evolutionRepository from '../../infrastructure/repositories/EvolutionRepository';
import appointmentRepository from '../../infrastructure/repositories/AppointmentRepository';

const search = (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim();
  if (!q || q.length < 2) return res.json({ patients: [], evolutions: [], appointments: [] });

  res.json({
    patients: patientRepository.search(q),
    evolutions: evolutionRepository.search(q),
    appointments: appointmentRepository.search(q),
  });
};

export default { search };
