declare global {
  namespace Express {
    interface Request {
      user?: { role: string };
    }
  }
}

export {};
