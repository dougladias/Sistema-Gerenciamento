import express from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';
import permissionRoutes from './permission.routes';

const router = express.Router();

// Montando rotas
router.use('/', adminRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);

export default router;