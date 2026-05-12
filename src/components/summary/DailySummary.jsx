import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FutureSelfCard } from './FutureSelfCard.jsx';
import { generateDailySummary } from '../../utils/claudeClient.js';

function LoadingScreen() {
  const steps = ['Analyzing your choices...', 'Mapping behavioral patterns...', 'Projecting your trajectory...', 'Crafting your identity portrait...'];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % steps.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="relative w-28 h-28">
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: i % 2 === 0 ? 'rgba(0,212,177,0.3)' : 'rgba(167,139,250,0.3)' }}
            animate={{ scale: [1, 1.5 + i * 0.15, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.5, delay: i * 0.5, repeat: Infinity }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center text-4xl">🔮</div>
      </div>
      <div className="text-center max-w-xs">
        <p className="font-bold text-white text-lg mb-2" style={{ fontFamily: 'Space Grotesk' }}>Building your future portrait</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-slate-500"
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function DailySummary({ choices, profile, onClose }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!choices?.length) { setLoading(false); return; }
    generateDailySummary({ choices, profile })
      .then(setSummary)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {loading && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <LoadingScreen />
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-sm"
        >
          <p className="text-5xl mb-4">😶</p>
          <p className="text-red-400 text-sm mb-4">Something went wrong: {error}</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-black"
            style={{ background: 'linear-gradient(135deg, #00d4b1, #00c4a3)' }}
          >
            Close
          </button>
        </motion.div>
      )}

      {!loading && !error && !choices?.length && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-slate-400 text-sm mb-4">Add some cards to your day first to see your daily summary.</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-black"
            style={{ background: 'linear-gradient(135deg, #00d4b1, #00c4a3)' }}>
            Got it
          </button>
        </motion.div>
      )}

      {!loading && !error && summary && (
        <div className="w-full max-w-md overflow-y-auto max-h-[90vh]">
          <FutureSelfCard summary={summary} onClose={onClose} />
        </div>
      )}
    </motion.div>
  );
}
