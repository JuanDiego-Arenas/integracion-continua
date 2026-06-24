import { pool } from '../config/database.js';

export const findAll = async (filters = {}) => {
    let sql = 'SELECT p.*, c.nombre AS categoria_nombre FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE 1=1';
    const params = [];
    let i = 1;

    if (filters.categoria_id) { sql += ` AND p.categoria_id = $${i++}`; params.push(filters.categoria_id); }
    if (filters.activo !== undefined) { sql += ` AND p.activo = $${i++}`; params.push(filters.activo); }
    if (filters.search) { sql += ` AND (p.nombre ILIKE $${i} OR p.codigo ILIKE $${i})`; params.push(`%${filters.search}%`); i++; }

    sql += ' ORDER BY p.nombre';
    const { rows } = await pool.query(sql, params);
    return rows;
};

export const findById = async (id) => {
    const { rows } = await pool.query(
        'SELECT p.*, c.nombre AS categoria_nombre FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE p.id = $1', [id]
    );
    return rows[0] || null;
};

export const create = async ({ codigo, nombre, descripcion, categoria_id, stock_minimo, stock_actual, precio }) => {
    const { rows } = await pool.query(
        'INSERT INTO productos (codigo, nombre, descripcion, categoria_id, stock_minimo, stock_actual, precio) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [codigo, nombre, descripcion, categoria_id, stock_minimo || 0, stock_actual || 0, precio || 0]
    );
    return rows[0];
};

export const update = async (id, { codigo, nombre, descripcion, categoria_id, stock_minimo, precio, activo }) => {
    const { rows } = await pool.query(
        'UPDATE productos SET codigo = $1, nombre = $2, descripcion = $3, categoria_id = $4, stock_minimo = $5, precio = $6, activo = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
        [codigo, nombre, descripcion, categoria_id, stock_minimo || 0, precio || 0, activo, id]
    );
    return rows[0] || null;
};

export const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    return rowCount > 0;
};
