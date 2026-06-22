import { pool } from '../config/database.js';

export const getStockPorCategoria = async () => {
    const { rows } = await pool.query('SELECT * FROM vw_stock_por_categoria ORDER BY categoria');
    return rows;
};

export const getRotacionInventario = async () => {
    const { rows } = await pool.query('SELECT * FROM vw_rotacion_inventario ORDER BY indice_rotacion DESC');
    return rows;
};

export const getEvolucionMensual = async () => {
    const { rows } = await pool.query('SELECT * FROM vw_evolucion_mensual ORDER BY mes ASC');
    return rows;
};

export const getResumenGlobal = async () => {
    const { rows } = await pool.query(`SELECT
        (SELECT COUNT(*) FROM productos WHERE activo = TRUE) AS total_productos,
        (SELECT COUNT(*) FROM categorias) AS total_categorias,
        (SELECT COALESCE(SUM(stock_actual), 0) FROM productos WHERE activo = TRUE) AS stock_total,
        (SELECT COALESCE(SUM(stock_actual * precio), 0) FROM productos WHERE activo = TRUE) AS valor_total_inventario,
        (SELECT COUNT(*) FROM alertas_stock WHERE leida = FALSE) AS alertas_pendientes,
        (SELECT COUNT(*) FROM productos WHERE activo = TRUE AND stock_actual <= stock_minimo) AS productos_criticos,
        (SELECT COUNT(*) FROM productos WHERE activo = TRUE AND stock_actual = 0) AS productos_sin_stock`);
    return rows[0];
};

export const getMovimientosRecientes = async (limite = 10) => {
    const { rows } = await pool.query(`SELECT m.*, p.nombre AS producto_nombre, tm.nombre AS tipo_movimiento, tm.factor
        FROM movimientos m
        JOIN productos p ON p.id = m.producto_id
        JOIN tipos_movimiento tm ON tm.id = m.tipo_movimiento_id
        ORDER BY m.created_at DESC LIMIT $1`, [limite]);
    return rows;
};
