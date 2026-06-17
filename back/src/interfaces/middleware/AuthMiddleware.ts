import type { Request, Response, NextFunction } from 'express';
import * as jwtService from '../../infrastructure/auth/JwtService';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Não autorizado' }); return; }
  try {
    req.user = jwtService.verify(token);
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada, faça login novamente' });
  }
};
