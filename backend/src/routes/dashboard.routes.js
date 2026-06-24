import { Router } from 'express';
import * as DashboardController from '../controllers/dashboard.controller.js';
const router = Router();
router.get('/resumen', DashboardController.resumen);
router.get('/stock-por-categoria', DashboardController.stockPorCategoria);
router.get('/rotacion', DashboardController.rotacionInventario);
router.get('/evolucion-mensual', DashboardController.evolucionMensual);
router.get('/movimientos-recientes', DashboardController.movimientosRecientes);
export default router;
