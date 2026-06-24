import { Router } from 'express';
import { healthHandler } from '../controllers/health.controller.js';

const router = Router();

router.get('/health', healthHandler);

export default router;
