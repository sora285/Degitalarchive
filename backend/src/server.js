import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { checkDbConnection } from './config/db.js';
import authRouter from './routes/auth.js';
import schoolsRouter from './routes/schools.js';
import articlesRouter from './routes/articles.js';
import classesRouter from './routes/classes.js';
import companiesRouter from './routes/companies.js';
import categoriesRouter from './routes/categories.js';
import imageLibraryRouter from './routes/imageLibrary.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateRequest } from './middleware/auth.js';

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());
app.use(authenticateRequest);

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'digitalarchive-api is running',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/schools', schoolsRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/classes', classesRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/image-library', imageLibraryRouter);
app.use(errorHandler);

async function start() {
  await checkDbConnection();
  app.listen(env.port, () => {
    console.log(`API server listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});
