import { Router } from 'express';
import * as AlertaController from '../controllers/alerta.controller.js';
const router = Router();
router.get('/', AlertaController.listar);
router.get('/no-leidas', AlertaController.contarNoLeidas);
router.patch('/:id/leer', AlertaController.marcarLeida);
router.post('/leer-todas', AlertaController.marcarTodasLeidas);
export default router;
