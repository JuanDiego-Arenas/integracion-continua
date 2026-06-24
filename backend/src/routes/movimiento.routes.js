import { Router } from 'express';
import * as MovimientoController from '../controllers/movimiento.controller.js';
const router = Router();
router.get('/tipos', MovimientoController.listarTipos);
router.get('/', MovimientoController.listar);
router.get('/:id', MovimientoController.obtener);
router.post('/', MovimientoController.crear);
export default router;
