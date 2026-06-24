import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const initDatabase = async () => {
    try {
        const schemaPath = join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        console.log('Ejecutando esquema de base de datos...');
        await pool.query(schema);
        console.log('Esquema de base de datos ejecutado correctamente');
    } catch (error) {
        if (error.code === '42P07') {
            console.log('El esquema ya está inicializado (las tablas ya existen)');
        } else if (error.code === '42710') {
            console.log('Extensiones ya instaladas');
        } else {
            throw error;
        }
    }
};
