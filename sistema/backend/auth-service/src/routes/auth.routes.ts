import express, { NextFunction } from 'express';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import userRepository from '../repositories/user.repository';
import roleRepository from '../repositories/role.repository';
import permissionRepository from '../repositories/permission.repository';
import { generateToken, verifyToken, extractTokenFromHeader } from '../utils/jwt';
import AuthMiddleware from '../middlewares/auth.middleware';

// Extende o tipo Request para incluir a propriedade 'user'
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      roleId: string;
      [key: string]: any;
    }
    interface Request {
      user?: User;
    }
  }
}

const router = express.Router();

router.post('/login', asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios' });
      return;
    }

    // Buscar usuário com role
    const user = await userRepository.findByEmail(email);
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Usuário inativo' });
      return;
    }

    // Atualizar último login
    await userRepository.updateLastLogin(user._id.toString());

    // Buscar role com permissões
    const role = await roleRepository.findById(user.role.toString());

    // Gerar token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      roleId: user.role.toString()
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
}));

// Registro
router.post('/register', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      return;
    }
    
    if (password.length < 6) {
      res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
      return;
    }
    
    // Verificar se usuário já existe
    if (await userRepository.exists(email)) {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }
    
    // Buscar role padrão
    const defaultRole = await roleRepository.findDefault();
    if (!defaultRole) {
      res.status(500).json({ error: 'Role padrão não encontrada' });
      return;
    }
    
    // Criar usuário
    const user = await userRepository.create({
      email,
      password,
      name,
      role: defaultRole._id
    });
    
    // Gerar token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      roleId: defaultRole._id.toString()
    });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: {
          id: defaultRole._id,
          name: defaultRole.name
        }
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
}));

// Verificar token
router.get('/verify',  asyncHandler(async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const payload = verifyToken(token);
    const user = await userRepository.findById(payload.userId);

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Usuário inválido' });
      return;
    }

    const role = await roleRepository.findById(user.role.toString());

    res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: role
      }
    });
    return;
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
}));

// Verificar permissão específica
router.post('/check-permission', AuthMiddleware.authenticate,  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resource, action, route } = req.body;
    
    // Buscar usuário com role e permissões
    const user = await userRepository.findById(req.user!.id);
    if (!user) {
      res.json({ hasPermission: false });
      return;
    }

    const role = await roleRepository.findById(user.role.toString());
    if (!role) {
      res.json({ hasPermission: false });
      return;
    }

    let hasPermission = false;

    if (route) {
      // Verificar permissão de rota
      const routePermissions = await permissionRepository.findByRoute(route);
      const routePermissionIds = routePermissions.map(p => p._id.toString());
      
      hasPermission = role.permissions.some(permId => 
        routePermissionIds.includes(permId.toString())
      );
    } else if (resource && action) {
      // Verificar permissão de recurso/ação
      const permission = await permissionRepository.findByResourceAndAction(resource, action);
      if (permission) {
        hasPermission = role.permissions.some(permId => 
          permId.toString() === permission._id.toString()
        );
      }
    }

    res.json({ hasPermission });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
}));

export default router;