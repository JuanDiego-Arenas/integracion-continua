import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import router from './routes/index.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(join(__dirname, '..', 'public')));

app.use('/api', router);

app.use(errorHandler);

export default app;
