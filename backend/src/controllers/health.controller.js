export const healthHandler = (req, res) => {
	return res.status(200).json({
		success: true,
		message: 'API funcionando correctamente',
	});
};
