import * as Producto from '../models/producto.model.js';

export const listar = async (req, res, next) => {
    try { const productos = await Producto.findAll(req.query); return res.json({ success: true, data: productos }); }
    catch (error) { next(error); }
};

export const obtener = async (req, res, next) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        return res.json({ success: true, data: producto });
    } catch (error) { next(error); }
};

export const crear = async (req, res, next) => {
    try {
        const { codigo, nombre, descripcion, categoria_id, stock_minimo, stock_actual, precio } = req.body;
        if (!codigo?.trim()) return res.status(400).json({ success: false, message: 'El código es requerido' });
        if (!nombre?.trim()) return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        if (!categoria_id) return res.status(400).json({ success: false, message: 'La categoría es requerida' });
        const producto = await Producto.create({ codigo: codigo.trim(), nombre: nombre.trim(), descripcion, categoria_id, stock_minimo: Math.max(0, parseInt(stock_minimo) || 0), stock_actual: Math.max(0, parseInt(stock_actual) || 0), precio: Math.max(0, parseFloat(precio) || 0) });
        return res.status(201).json({ success: true, data: producto });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ success: false, message: 'Ya existe un producto con ese código' });
        if (error.code === '23503') return res.status(400).json({ success: false, message: 'La categoría especificada no existe' });
        next(error);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { codigo, nombre, descripcion, categoria_id, stock_minimo, precio, activo } = req.body;
        if (!codigo?.trim()) return res.status(400).json({ success: false, message: 'El código es requerido' });
        if (!nombre?.trim()) return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        const producto = await Producto.update(req.params.id, { codigo: codigo.trim(), nombre: nombre.trim(), descripcion, categoria_id, stock_minimo: Math.max(0, parseInt(stock_minimo) || 0), precio: Math.max(0, parseFloat(precio) || 0), activo: activo !== undefined ? activo : true });
        if (!producto) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        return res.json({ success: true, data: producto });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ success: false, message: 'Ya existe un producto con ese código' });
        next(error);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const eliminado = await Producto.remove(req.params.id);
        if (!eliminado) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        return res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        if (error.code === '23503') return res.status(409).json({ success: false, message: 'No se puede eliminar: tiene movimientos asociados' });
        next(error);
    }
};
