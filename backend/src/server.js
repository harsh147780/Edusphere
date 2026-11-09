import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import { backendRoot, uploadsDir } from './config/paths.js';

dotenv.config({ path: path.join(backendRoot, '.env') });
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

configureCloudinary();

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

app.use(
  '/api/auth/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: 'Too many login attempts' } })
);
app.use(
  '/api/auth/forgot-password',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many reset requests, please try again later' } })
);

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'EduSphere API' }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`EduSphere API running on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('Failed to start', err);
    process.exit(1);
  });
