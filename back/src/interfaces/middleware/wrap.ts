import type { Request, Response, NextFunction, RequestHandler } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

// Envolve handlers síncronos/assíncronos com try/catch automático
export const wrap = (fn: Handler): RequestHandler => (req, res, next) => {
  try {
    const result = fn(req, res, next);
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      (result as Promise<unknown>).catch(next);
    }
  } catch (err) {
    next(err);
  }
};
