import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { randomUUID } from 'crypto';
import {
  JWT_SECRET,
  JWT_ISSUER,
  JWT_AUDIENCE,
  ACCESS_TOKEN_TTL_SECONDS,
} from '../config';

export interface AccessTokenClaims extends JWTPayload {
  sub: string;
  jti: string;
  type: 'access';
  email: string;
  sessionId: string;
}

export async function createAccessToken(args: {
  userId: string;
  email: string;
  sessionId: string;
}): Promise<{ token: string; jti: string }> {
  const jti = randomUUID();
  const token = await new SignJWT({
    sub: args.userId,
    jti,
    type: 'access',
    email: args.email,
    sessionId: args.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(JWT_SECRET);

  return { token, jti };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ['HS256'],
  });

  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return payload as AccessTokenClaims;
}
