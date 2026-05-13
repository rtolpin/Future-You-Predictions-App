import express from 'express';
import { simulateDecision, simulateDecisionStream, generateDailySummary, simulateDayFlow } from '../services/claudeService.js';

const router = express.Router();

router.post('/decision', async (req, res) => {
  try {
    const result = await simulateDecision(req.body);
    res.json(result);
  } catch (err) {
    console.error('Simulate error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/decision/stream', (req, res) => {
  simulateDecisionStream({ ...req.body, res });
});

router.post('/day', async (req, res) => {
  try {
    const result = await simulateDayFlow(req.body);
    res.json(result);
  } catch (err) {
    console.error('Day simulation error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/summary', async (req, res) => {
  try {
    const result = await generateDailySummary(req.body);
    res.json(result);
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
