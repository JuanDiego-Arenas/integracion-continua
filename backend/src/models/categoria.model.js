import { pool } from '../config/database.js';

export const findAll = async () => {
    const { rows } = await pool.query('SELECT * FROM categorias ORDER BY nombre');
    return rows;
};

export const findById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM categorias WHERE id = $1', [id]);
    return rows[0] || null;
};

export const create = async ({ nombre, descripcion }) => {
    const { rows } = await pool.query(
        'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
        [nombre, descripcion]
    );
    return rows[0];
};

export const update = async (id, { nombre, descripcion }) => {
    const { rows } = await pool.query(
        'UPDATE categorias SET nombre = $1, descripcion = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [nombre, descripcion, id]
    );
    return rows[0] || null;
};

export const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM categorias WHERE id = $1', [id]);
    return rowCount > 0;
};
