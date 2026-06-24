import * as Alerta from '../models/alerta.model.js';

export const listar = async (req, res, next) => {
    try { const alertas = await Alerta.findAll(req.query); return res.json({ success: true, data: alertas }); }
    catch (error) { next(error); }
};

export const marcarLeida = async (req, res, next) => {
    try {
        const alerta = await Alerta.marcarLeida(req.params.id);
        if (!alerta) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
        return res.json({ success: true, data: alerta });
    } catch (error) { next(error); }
};

export const marcarTodasLeidas = async (req, res, next) => {
    try { const count = await Alerta.marcarTodasLeidas(); return res.json({ success: true, message: count + ' alertas marcadas como leídas' }); }
    catch (error) { next(error); }
};

export const contarNoLeidas = async (req, res, next) => {
    try { const total = await Alerta.countNoLeidas(); return res.json({ success: true, data: { total } }); }
    catch (error) { next(error); }
};
