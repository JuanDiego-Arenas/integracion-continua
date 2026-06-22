export const errorHandler = (err, req, res, _next) => {
    console.error('Error:', err.message);
    if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'JSON inválido' });
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
};
