import { motion } from 'framer-motion';
import { FutureScoreBar } from '../prediction/FutureScoreBar.jsx';
import { getScoreColor } from '../../utils/scoreCalculator.js';
import { RotateCcw } from 'lucide-react';

function hexToRgb(hex) {
  if (hex === '#00d4b1') return '0,212,177';
  if (hex === '#f59e0b') return '245,158,11';
  return '248,113,113';
}

export function FutureSelfCard({ summary, onClose }) {
  if (!summary) return null;
  const { headline, summary: text, trend, scores, thirtyDayProjection, oneWin, oneRisk } = summary;
  const overall = scores?.overall ?? 5;
  const scoreColor = getScoreColor(overall);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="relative rounded-3xl overflow-hidden w-full max-w-md mx-auto"
      style={{
        background: 'linear-gradient(145deg, #0e0e1a 0%, #12121e 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `0 0 80px rgba(${hexToRgb(scoreColor)},0.15), 0 40px 80px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Background glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, rgba(${hexToRgb(scoreColor)},0.12) 0%, transparent 70%)` }}
      />

      <div className="relative z-10 p-7">
        {/* Trend badge */}
        {trend && (
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-5"
          >
            <span
              className="text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest"
              style={{
                background: `rgba(${hexToRgb(scoreColor)},0.15)`,
                color: scoreColor,
                border: `1px solid rgba(${hexToRgb(scoreColor)},0.3)`,
                fontFamily: 'Space Grotesk',
              }}
            >
              {trend}
            </span>
          </motion.div>
        )}

        {/* Score ring */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
          className="flex justify-center mb-5"
        >
          <div
            className="w-20 h-20 rounded-full flex flex-col items-center justify-center"
            style={{
              background: `radial-gradient(circle, rgba(${hexToRgb(scoreColor)},0.15) 0%, rgba(${hexToRgb(scoreColor)},0.04) 100%)`,
              border: `2px solid rgba(${hexToRgb(scoreColor)},0.35)`,
              boxShadow: `0 0 24px rgba(${hexToRgb(scoreColor)},0.25)`,
            }}
          >
            <span className="text-2xl font-black font-mono" style={{ color: scoreColor, fontFamily: 'JetBrains Mono' }}>{overall}</span>
            <span className="text-xs" style={{ color: scoreColor, opacity: 0.7, fontSize: 9 }}>SCORE</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-white text-center mb-2 leading-tight"
          style={{ fontFamily: 'Space Grotesk' }}
        >
          {headline}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="text-sm text-slate-400 text-center leading-relaxed mb-6"
        >
          {text}
        </motion.p>

        {/* Score bars */}
        {scores && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mb-5 p-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <FutureScoreBar scores={scores} />
          </motion.div>
        )}

        {/* 30-day projection */}
        {thirtyDayProjection && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-4 p-4 rounded-2xl"
            style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}
          >
            <p className="text-xs font-bold text-purple-400 mb-1.5 flex items-center gap-1.5">📅 30-Day Projection</p>
            <p className="text-xs text-slate-400 leading-relaxed">{thirtyDayProjection}</p>
          </motion.div>
        )}

        {/* Win / Risk */}
        {(oneWin || oneRisk) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.52 }}
            className="grid grid-cols-2 gap-3 mb-5"
          >
            {oneWin && (
              <div className="p-3 rounded-xl" style={{ background: 'rgba(0,212,177,0.08)', border: '1px solid rgba(0,212,177,0.2)' }}>
                <p className="text-xs font-bold text-teal-400 mb-1">✅ Today's Win</p>
                <p className="text-xs text-slate-400 leading-snug">{oneWin}</p>
              </div>
            )}
            {oneRisk && (
              <div className="p-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <p className="text-xs font-bold text-red-400 mb-1">⚠️ Watch For</p>
                <p className="text-xs text-slate-400 leading-snug">{oneRisk}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* CTA */}
        {onClose && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onClose}
            whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(0,212,177,0.4)' }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-black flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #00d4b1, #00c4a3)', boxShadow: '0 0 16px rgba(0,212,177,0.25)' }}
          >
            <RotateCcw size={14} /> Start New Simulation
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
