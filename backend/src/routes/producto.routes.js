import { Router } from 'express';
import * as ProductoController from '../controllers/producto.controller.js';
const router = Router();
router.get('/', ProductoController.listar);
router.get('/:id', ProductoController.obtener);
router.post('/', ProductoController.crear);
router.put('/:id', ProductoController.actualizar);
router.delete('/:id', ProductoController.eliminar);
export default router;
