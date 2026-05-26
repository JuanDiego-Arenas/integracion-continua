import dotenv from 'dotenv';
import app from './app.js';
import { pool } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
	try {
		await pool.query('SELECT NOW()');

		console.log('Conectado a PostgreSQL');

		app.listen(PORT, () => {
			console.log(`Servidor ejecutándose en puerto ${PORT}`);
		});
	} catch (error) {
		console.error('Error conectando a PostgreSQL:', error);

		process.exit(1);
	}
};

const shutdown = async () => {
	console.log('\nCerrando servidor...');

	await pool.end();

	console.log('Conexión PostgreSQL cerrada');

	process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
