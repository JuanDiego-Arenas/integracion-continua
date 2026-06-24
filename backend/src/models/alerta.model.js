import { pool } from '../config/database.js';

export const findAll = async (filters = {}) => {
    let sql = 'SELECT a.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo, p.stock_actual, p.stock_minimo, c.nombre AS categoria_nombre FROM alertas_stock a JOIN productos p ON p.id = a.producto_id JOIN categorias c ON c.id = p.categoria_id WHERE 1=1';
    const params = [];
    let i = 1;
    if (filters.leida !== undefined) { sql += ` AND a.leida = $${i++}`; params.push(filters.leida); }
    sql += ' ORDER BY a.created_at DESC';
    const { rows } = await pool.query(sql, params);
    return rows;
};

export const marcarLeida = async (id) => {
    const { rows } = await pool.query('UPDATE alertas_stock SET leida = TRUE WHERE id = $1 RETURNING *', [id]);
    return rows[0] || null;
};

export const marcarTodasLeidas = async () => {
    const { rowCount } = await pool.query('UPDATE alertas_stock SET leida = TRUE WHERE leida = FALSE');
    return rowCount;
};

export const countNoLeidas = async () => {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM alertas_stock WHERE leida = FALSE');
    return rows[0].total;
};
