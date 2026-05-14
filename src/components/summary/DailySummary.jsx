import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FutureSelfCard } from './FutureSelfCard.jsx';
import { generateDailySummary } from '../../utils/claudeClient.js';

function LoadingScreen() {
  const steps = ['Analyzing your choices...', 'Mapping behavioral patterns...', 'Projecting your trajectory...', 'Crafting your identity portrait...'];
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % steps.length), 1800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setProgress(Math.min(99, Math.floor(99 * (1 - Math.exp(-elapsed / 12)))));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36, width: 380 }}>
      {/* Orb */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid', borderColor: i % 2 === 0 ? 'rgba(0,212,177,0.3)' : 'rgba(167,139,250,0.2)' }}
            animate={{ scale: [1, 1.5 + i * 0.15, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.5, delay: i * 0.5, repeat: Infinity }}
          />
        ))}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>🔮</div>
      </div>

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 22, color: '#fff', margin: 0 }}>Building your future portrait</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans', margin: 0 }}
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans' }}>Generating summary…</span>
          <motion.span
            key={progress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 15, color: '#00d4b1', minWidth: 42, textAlign: 'right' }}
          >
            {progress}%
          </motion.span>
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          <motion.div
            style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #00d4b1, #a78bfa)', boxShadow: '0 0 10px rgba(0,212,177,0.5)', transformOrigin: 'left' }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

export function DailySummary({ choices, profile, onClose, onComplete }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!choices?.length) { setLoading(false); return; }
    generateDailySummary({ choices, profile })
      .then(result => { setSummary(result); onComplete?.(result); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: '#09090f',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,212,177,0.07) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 40% at 85% 80%, rgba(167,139,250,0.05) 0%, transparent 55%)' }} />
      </div>

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 2, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(9,9,15,0.8)', backdropFilter: 'blur(20px)',
      }}>
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onClose}
          whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 12, cursor: 'pointer', border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 700,
            fontFamily: 'Space Grotesk',
          }}
        >
          ← Back to Day Canvas
        </motion.button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <span style={{
            fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 17,
            background: 'linear-gradient(135deg, #fff 0%, rgba(0,212,177,0.9) 60%, rgba(167,139,250,0.9) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Daily Summary
          </span>
        </div>

        <motion.button
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onClose}
          whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.12)' }}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', border: 'none',
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.6)', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Close"
        >
          ✕
        </motion.button>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '40px 32px' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <LoadingScreen />
            </motion.div>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', maxWidth: 400 }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>😶</p>
              <p style={{ color: '#f87171', fontSize: 14, marginBottom: 20, fontFamily: 'DM Sans' }}>Something went wrong: {error}</p>
              <button
                onClick={onClose}
                style={{ padding: '10px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#000', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #00d4b1, #00c4a3)', fontFamily: 'Space Grotesk' }}
              >
                Close
              </button>
            </motion.div>
          </div>
        )}

        {!loading && !error && !choices?.length && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', maxWidth: 400 }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>📅</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, marginBottom: 20, fontFamily: 'DM Sans' }}>Add some cards to your day first to see your daily summary.</p>
              <button onClick={onClose} style={{ padding: '10px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#000', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #00d4b1, #00c4a3)', fontFamily: 'Space Grotesk' }}>
                Got it
              </button>
            </motion.div>
          </div>
        )}

        {!loading && !error && summary && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ maxWidth: 960, margin: '0 auto' }}
          >
            <FutureSelfCard summary={summary} onClose={onClose} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
