import * as Categoria from '../models/categoria.model.js';

export const listar = async (req, res, next) => {
    try { const categorias = await Categoria.findAll(); return res.json({ success: true, data: categorias }); }
    catch (error) { next(error); }
};

export const obtener = async (req, res, next) => {
    try {
        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        return res.json({ success: true, data: categoria });
    } catch (error) { next(error); }
};

export const crear = async (req, res, next) => {
    try {
        const { nombre, descripcion } = req.body;
        if (!nombre?.trim()) return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        const categoria = await Categoria.create({ nombre: nombre.trim(), descripcion });
        return res.status(201).json({ success: true, data: categoria });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ success: false, message: 'Ya existe una categoría con ese nombre' });
        next(error);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { nombre, descripcion } = req.body;
        if (!nombre?.trim()) return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        const categoria = await Categoria.update(req.params.id, { nombre: nombre.trim(), descripcion });
        if (!categoria) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        return res.json({ success: true, data: categoria });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ success: false, message: 'Ya existe una categoría con ese nombre' });
        next(error);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const eliminado = await Categoria.remove(req.params.id);
        if (!eliminado) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        return res.json({ success: true, message: 'Categoría eliminada' });
    } catch (error) {
        if (error.code === '23503') return res.status(409).json({ success: false, message: 'No se puede eliminar: tiene productos asociados' });
        next(error);
    }
};
