import express from 'express';
import AuthMiddleware from '../middlewares/auth.middleware';
import PermissionMiddleware from '../middlewares/permission.middleware';

const router = express.Router();

// Rota de status
router.get('/', async (req, res) => {
  res.json({ 
    message: 'Auth Service funcionando!',
    version: '1.0.0',
    endpoints: {
      auth: [
        'POST /auth/login',
        'POST /auth/register',
        'GET /auth/verify',
        'POST /auth/check-permission',
        'POST /auth/refresh'
      ],
      users: [
        'GET /users',
        'GET /users/:id',
        'PUT /users/:id',
        'DELETE /users/:id',
        'PUT /users/:id/activate',
        'PUT /users/:id/deactivate',
        'PUT /users/:id/change-role'
      ],
      roles: [
        'GET /roles',
        'GET /roles/:id',
        'POST /roles',
        'PUT /roles/:id',
        'DELETE /roles/:id'
      ],
      permissions: [
        'GET /permissions',
        'GET /permissions/grouped'
      ]
    }
  });
});

// HEAD para health check
router.head('/', (req, res) => {
  res.status(200).end();
});

export default router;