import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
	return res.status(200).json({
		success: true,
		message: 'API funcionando correctamente',
	});
});

export default router;
