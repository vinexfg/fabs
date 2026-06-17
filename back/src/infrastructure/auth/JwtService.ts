import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET não definido no .env');

export interface JwtPayload {
  role: string;
}

export const sign = (payload: JwtPayload): string => jwt.sign(payload, SECRET, { expiresIn: '8h' });

export const verify = (token: string): JwtPayload => jwt.verify(token, SECRET) as JwtPayload;
