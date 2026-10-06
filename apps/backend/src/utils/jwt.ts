import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../middlewares/authenticate';

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions);

export const signRefreshToken = (payload: Pick<JwtPayload, 'userId'>): string =>
  jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn } as jwt.SignOptions);

export const verifyRefreshToken = (token: string): Pick<JwtPayload, 'userId'> =>
  jwt.verify(token, env.jwt.refreshSecret) as Pick<JwtPayload, 'userId'>;

export const getRefreshTokenExpiry = (): Date => {
  const days = parseInt(env.jwt.refreshExpiresIn.replace('d', ''), 10) || 7;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
};
