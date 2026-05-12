import express from 'express';

const router = express.Router();

// Profile is managed client-side in localStorage; this route is a placeholder
router.get('/', (req, res) => {
  res.json({ message: 'Profile is stored client-side' });
});

export default router;
