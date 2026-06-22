import { pool } from '../config/database.js';

export const findAll = async (filters = {}) => {
    let sql = 'SELECT m.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo, tm.nombre AS tipo_movimiento, tm.factor FROM movimientos m JOIN productos p ON p.id = m.producto_id JOIN tipos_movimiento tm ON tm.id = m.tipo_movimiento_id WHERE 1=1';
    const params = [];
    let i = 1;
    if (filters.producto_id) { sql += ` AND m.producto_id = $${i++}`; params.push(filters.producto_id); }
    if (filters.tipo_movimiento_id) { sql += ` AND m.tipo_movimiento_id = $${i++}`; params.push(filters.tipo_movimiento_id); }
    if (filters.desde) { sql += ` AND m.created_at >= $${i++}`; params.push(filters.desde); }
    if (filters.hasta) { sql += ` AND m.created_at <= $${i++}`; params.push(filters.hasta); }
    sql += ' ORDER BY m.created_at DESC LIMIT 500';
    const { rows } = await pool.query(sql, params);
    return rows;
};

export const findById = async (id) => {
    const { rows } = await pool.query(
        'SELECT m.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo, tm.nombre AS tipo_movimiento, tm.factor FROM movimientos m JOIN productos p ON p.id = m.producto_id JOIN tipos_movimiento tm ON tm.id = m.tipo_movimiento_id WHERE m.id = $1', [id]
    );
    return rows[0] || null;
};

export const registrarMovimiento = async ({ producto_id, tipo_movimiento_id, cantidad, observacion, usuario }) => {
    const { rows } = await pool.query('SELECT * FROM registrar_movimiento($1, $2, $3, $4, $5)', [producto_id, tipo_movimiento_id, cantidad, observacion, usuario || 'sistema']);
    return rows[0] || null;
};

export const getTiposMovimiento = async () => {
    const { rows } = await pool.query('SELECT * FROM tipos_movimiento ORDER BY id');
    return rows;
};
