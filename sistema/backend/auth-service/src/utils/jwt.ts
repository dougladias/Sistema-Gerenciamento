import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || 'sua-chave-secreta-deve-ser-alterada';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface TokenPayload {
  userId: string;
  email: string;
  roleId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'auth-service'
  } as jwt.SignOptions);
};

export const generateRefreshToken = (userId: string): string => {
  const payload: RefreshTokenPayload = {
    userId,
    type: 'refresh'
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'auth-service'
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'auth-service'
    }) as TokenPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    throw error;
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'auth-service'
    }) as RefreshTokenPayload;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Token inválido');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expirado');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Refresh token inválido');
    }
    throw error;
  }
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

export const generatePasswordResetToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email, type: 'password-reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

export const verifyPasswordResetToken = (token: string): { userId: string; email: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'password-reset') {
      throw new Error('Token inválido');
    }
    
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    throw new Error('Token de reset inválido ou expirado');
  }
};