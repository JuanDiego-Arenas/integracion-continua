import { Router } from 'express';
import categoriaRoutes from './categoria.routes.js';
import productoRoutes from './producto.routes.js';
import movimientoRoutes from './movimiento.routes.js';
import alertaRoutes from './alerta.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import { healthHandler } from '../controllers/health.controller.js';

const router = Router();

router.get('/health', (req, res) => {
    return res.status(200).json({ success: true, message: 'CONTROLSTOCK API funcionando correctamente' });
});

router.use('/categorias', categoriaRoutes);
router.use('/productos', productoRoutes);
router.use('/movimientos', movimientoRoutes);
router.use('/alertas', alertaRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
