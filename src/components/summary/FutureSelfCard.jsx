import { motion } from 'framer-motion';
import { FutureScoreBar } from '../prediction/FutureScoreBar.jsx';
import { getScoreColor } from '../../utils/scoreCalculator.js';

function hexToRgb(hex) {
  if (hex === '#00d4b1') return '0,212,177';
  if (hex === '#f59e0b') return '245,158,11';
  return '248,113,113';
}

export function FutureSelfCard({ summary }) {
  if (!summary) return null;
  const { headline, summary: text, trend, scores, thirtyDayProjection, oneWin, oneRisk } = summary;
  const overall = scores?.overall ?? 5;
  const scoreColor = getScoreColor(overall);
  const rgb = hexToRgb(scoreColor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Hero row: score ring + headline + summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 40,
          padding: '40px 48px', borderRadius: 28,
          background: `linear-gradient(135deg, rgba(${rgb},0.1) 0%, rgba(${rgb},0.04) 100%)`,
          border: `1px solid rgba(${rgb},0.2)`,
          boxShadow: `0 0 60px rgba(${rgb},0.1)`,
        }}
      >
        {/* Score ring */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 }}
          style={{
            flexShrink: 0, width: 130, height: 130, borderRadius: '50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(circle, rgba(${rgb},0.2) 0%, rgba(${rgb},0.06) 100%)`,
            border: `2.5px solid rgba(${rgb},0.45)`,
            boxShadow: `0 0 40px rgba(${rgb},0.35), inset 0 0 30px rgba(${rgb},0.08)`,
          }}
        >
          <span style={{ fontSize: 42, fontWeight: 900, color: scoreColor, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{overall}</span>
          <span style={{ fontSize: 11, color: scoreColor, opacity: 0.7, fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.1em', marginTop: 4 }}>/ 10</span>
        </motion.div>

        {/* Headline + text */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {trend && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '6px 18px', borderRadius: 99, fontFamily: 'Space Grotesk',
                background: `rgba(${rgb},0.15)`, color: scoreColor,
                border: `1px solid rgba(${rgb},0.3)`,
              }}
            >
              {trend}
            </motion.span>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            style={{
              fontFamily: 'Space Grotesk', fontSize: 34, fontWeight: 800, lineHeight: 1.2, margin: 0,
              background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            {headline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: 16, color: 'rgba(255,255,255,0.52)', lineHeight: 1.75, margin: 0, fontFamily: 'DM Sans' }}
          >
            {text}
          </motion.p>
        </div>
      </motion.div>

      {/* Details row */}
      <div style={{ display: 'grid', gridTemplateColumns: scores ? '1fr 1fr' : '1fr', gap: 24 }}>

        {/* Score bars */}
        {scores && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            style={{
              padding: '28px 30px', borderRadius: 24,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk', marginBottom: 22,
            }}>
              Day Scores
            </p>
            <FutureScoreBar scores={scores} />
          </motion.div>
        )}

        {/* Right column: 30-day + win/risk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {thirtyDayProjection && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46 }}
              style={{
                padding: '26px 28px', borderRadius: 24,
                background: 'rgba(167,139,250,0.07)',
                border: '1px solid rgba(167,139,250,0.2)',
              }}
            >
              <p style={{
                fontSize: 12, fontWeight: 800, color: '#a78bfa', fontFamily: 'Space Grotesk',
                display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14,
              }}>
                📅 30-Day Projection
              </p>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0, fontFamily: 'DM Sans' }}>
                {thirtyDayProjection}
              </p>
            </motion.div>
          )}

          {(oneWin || oneRisk) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54 }}
              style={{ display: 'grid', gridTemplateColumns: oneWin && oneRisk ? '1fr 1fr' : '1fr', gap: 16 }}
            >
              {oneWin && (
                <div style={{
                  padding: '22px 22px', borderRadius: 22,
                  background: 'rgba(0,212,177,0.07)',
                  border: '1px solid rgba(0,212,177,0.22)',
                }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#00d4b1', fontFamily: 'Space Grotesk', marginBottom: 10 }}>
                    ✅ Today's Win
                  </p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: 0, fontFamily: 'DM Sans' }}>
                    {oneWin}
                  </p>
                </div>
              )}
              {oneRisk && (
                <div style={{
                  padding: '22px 22px', borderRadius: 22,
                  background: 'rgba(248,113,113,0.07)',
                  border: '1px solid rgba(248,113,113,0.22)',
                }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#f87171', fontFamily: 'Space Grotesk', marginBottom: 10 }}>
                    ⚠️ Watch For
                  </p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: 0, fontFamily: 'DM Sans' }}>
                    {oneRisk}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
