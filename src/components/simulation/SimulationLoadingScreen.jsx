import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const INSIGHT_MESSAGES = [
  'Analyzing your full day…',
  'Mapping your social environment…',
  'Modeling energy and mood flow…',
  'Calculating activity synergies…',
  'Projecting behavioral patterns…',
  "Building your future self's narrative…",
  'Weighing ripple effects…',
];

export function SimulationLoadingScreen({ active, currentAction }) {
  const [insightIdx, setInsightIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // Continuous asymptotic: p = 99 × (1 - e^(-t/12)) — always moving, never stuck
  useEffect(() => {
    if (!active) { setProgress(0); setInsightIdx(0); return; }
    setProgress(0);
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const p = Math.min(99, Math.floor(99 * (1 - Math.exp(-elapsed / 12))));
      setProgress(p);
    }, 100);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!active) { setInsightIdx(0); return; }
    const t = setInterval(() => setInsightIdx(i => (i + 1) % INSIGHT_MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="sim-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(9,9,15,0.97)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Ambient glow */}
          <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,177,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, maxWidth: 460, width: '100%', padding: '0 32px', position: 'relative' }}>

            {/* Orb */}
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid', borderColor: i % 2 === 0 ? 'rgba(0,212,177,0.3)' : 'rgba(167,139,250,0.2)' }}
                  animate={{ scale: [1, 1.6 + i * 0.2, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
                />
              ))}
              <motion.div
                style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'rgba(0,212,177,0.8)', borderRightColor: 'rgba(0,212,177,0.3)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                style={{ position: 'absolute', inset: 24, borderRadius: '50%', border: '1.5px solid transparent', borderBottomColor: 'rgba(167,139,250,0.7)', borderLeftColor: 'rgba(167,139,250,0.3)' }}
                animate={{ rotate: -360 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                style={{ position: 'absolute', inset: 36, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,177,0.4), rgba(167,139,250,0.25))', boxShadow: '0 0 30px rgba(0,212,177,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                🔮
              </motion.div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <motion.h2
                style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 800, letterSpacing: '-0.3px', background: 'linear-gradient(135deg, #fff 0%, rgba(0,212,177,0.9) 55%, rgba(167,139,250,0.9) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}
                animate={{ opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                Simulating Your Day
              </motion.h2>
              {currentAction && (
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '6px 16px', borderRadius: 50, background: 'rgba(0,212,177,0.1)', border: '1px solid rgba(0,212,177,0.25)', color: '#00d4b1', fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans' }}>
                  <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>⚡</motion.span>
                  Analyzing {currentAction}
                </div>
              )}
            </div>

            {/* Progress bar + percentage */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans' }}>Generating prediction…</span>
                <motion.span
                  key={progress}
                  initial={{ scale: 1.2, color: '#00d4b1' }}
                  animate={{ scale: 1, color: '#00d4b1' }}
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

            {/* Cycling message */}
            <div style={{ minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.p
                  key={insightIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans', textAlign: 'center' }}
                >
                  {INSIGHT_MESSAGES[insightIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
