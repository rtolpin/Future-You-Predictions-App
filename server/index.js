import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import simulateRoutes from './routes/simulate.js';
import profileRoutes from './routes/profile.js';
import authRoutes from './routes/auth.js';
import daysRoutes from './routes/days.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/simulate', simulateRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/days', daysRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Future You server running on port ${PORT}`);
});
