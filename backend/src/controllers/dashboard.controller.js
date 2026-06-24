import * as Dashboard from '../models/dashboard.model.js';

export const resumen = async (req, res, next) => {
    try { const data = await Dashboard.getResumenGlobal(); return res.json({ success: true, data }); }
    catch (error) { next(error); }
};

export const stockPorCategoria = async (req, res, next) => {
    try { const data = await Dashboard.getStockPorCategoria(); return res.json({ success: true, data }); }
    catch (error) { next(error); }
};

export const rotacionInventario = async (req, res, next) => {
    try { const data = await Dashboard.getRotacionInventario(); return res.json({ success: true, data }); }
    catch (error) { next(error); }
};

export const evolucionMensual = async (req, res, next) => {
    try { const data = await Dashboard.getEvolucionMensual(); return res.json({ success: true, data }); }
    catch (error) { next(error); }
};

export const movimientosRecientes = async (req, res, next) => {
    try { const limite = parseInt(req.query.limite) || 10; const data = await Dashboard.getMovimientosRecientes(limite); return res.json({ success: true, data }); }
    catch (error) { next(error); }
};
