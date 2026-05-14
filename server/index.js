import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import simulateRoutes from './routes/simulate.js';
import profileRoutes from './routes/profile.js';
import authRoutes from './routes/auth.js';
import daysRoutes from './routes/days.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 3001;

// In production the frontend is served from the same origin, so no CORS needed.
// In development allow Vite dev server.
app.use(cors({
  origin: IS_PROD ? false : (req, callback) => callback(null, true),
  credentials: true,
}));

app.use(express.json());

app.use('/api/simulate', simulateRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/days', daysRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: IS_PROD ? 'production' : 'development' }));

// Serve the built React app in production
if (IS_PROD) {
  const distPath = join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('{*path}', (req, res) => res.sendFile(join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Future You server running on port ${PORT} (${IS_PROD ? 'production' : 'development'})`);
});
