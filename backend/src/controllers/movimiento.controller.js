import * as Movimiento from '../models/movimiento.model.js';

export const listar = async (req, res, next) => {
    try { const movimientos = await Movimiento.findAll(req.query); return res.json({ success: true, data: movimientos }); }
    catch (error) { next(error); }
};

export const obtener = async (req, res, next) => {
    try {
        const movimiento = await Movimiento.findById(req.params.id);
        if (!movimiento) return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
        return res.json({ success: true, data: movimiento });
    } catch (error) { next(error); }
};

export const crear = async (req, res, next) => {
    try {
        const { producto_id, tipo_movimiento_id, cantidad, observacion, usuario } = req.body;
        if (!producto_id) return res.status(400).json({ success: false, message: 'El producto es requerido' });
        if (!tipo_movimiento_id) return res.status(400).json({ success: false, message: 'El tipo de movimiento es requerido' });
        if (!cantidad || cantidad <= 0) return res.status(400).json({ success: false, message: 'La cantidad debe ser mayor a 0' });
        const resultado = await Movimiento.registrarMovimiento({ producto_id, tipo_movimiento_id, cantidad: parseInt(cantidad), observacion, usuario: usuario || 'sistema' });
        return res.status(201).json({ success: true, data: resultado });
    } catch (error) {
        if (error.message?.includes('Stock insuficiente')) return res.status(400).json({ success: false, message: error.message });
        if (error.message?.includes('Producto no encontrado')) return res.status(404).json({ success: false, message: error.message });
        next(error);
    }
};

export const listarTipos = async (req, res, next) => {
    try { const tipos = await Movimiento.getTiposMovimiento(); return res.json({ success: true, data: tipos }); }
    catch (error) { next(error); }
};
