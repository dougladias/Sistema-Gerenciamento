import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import userRepository from '../repositories/user.repository';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: string;
  };
}

class AuthMiddleware {
  async authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.headers.authorization) {
        res.status(401).json({ error: 'Token não fornecido' });
        return;
      }
      // Lógica de autenticação, por exemplo:
      const token = req.headers.authorization.split(' ')[1];
      const payload = verifyToken(token);
      // Supondo que adicionamos a informação do usuário à requisição
      req.user = { id: payload.userId, email: payload.email, roleId: payload.roleId };
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  }
}

export default new AuthMiddleware();