import { motion } from 'framer-motion';
import { getScoreColor, getScoreLabel } from '../../utils/scoreCalculator.js';

const SCORE_ITEMS = [
  { key: 'energy',       label: 'Energy',      icon: '🔋' },
  { key: 'mood',         label: 'Mood',         icon: '😊' },
  { key: 'productivity', label: 'Focus',        icon: '🎯' },
  { key: 'social',       label: 'Social',       icon: '🤝' },
];

function hexToRgb(color) {
  if (color === '#00d4b1') return '0,212,177';
  if (color === '#f59e0b') return '245,158,11';
  return '248,113,113';
}

export function FutureScoreBar({ scores }) {
  if (!scores) return null;
  const overall = scores.overall ?? 5;
  const scoreColor = getScoreColor(overall);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Individual score rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SCORE_ITEMS.map(({ key, label, icon }, i) => {
          const value = scores[key] ?? 5;
          const color = getScoreColor(value);
          const pct = (value / 10) * 100;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Icon */}
              <span style={{ fontSize: 16, width: 22, flexShrink: 0, lineHeight: 1 }}>{icon}</span>

              {/* Label */}
              <span style={{
                fontSize: 12, fontWeight: 700, flexShrink: 0, width: 64,
                color: 'rgba(255,255,255,0.65)', fontFamily: 'Space Grotesk',
                letterSpacing: '0.01em',
              }}>
                {label}
              </span>

              {/* Bar track */}
              <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative' }}>
                <motion.div
                  style={{
                    position: 'absolute', top: 0, left: 0, height: '100%',
                    borderRadius: 99,
                    background: `linear-gradient(90deg, ${color}55, ${color})`,
                    boxShadow: `0 0 8px ${color}60`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 + i * 0.08 }}
                />
              </div>

              {/* Value + label */}
              <div style={{ flexShrink: 0, width: 52, textAlign: 'right' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 900, fontSize: 15, color }}>{value}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Sans' }}>/10</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall score pill */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 18px',
          borderRadius: 16,
          background: `linear-gradient(135deg, rgba(${hexToRgb(scoreColor)},0.15), rgba(${hexToRgb(scoreColor)},0.07))`,
          border: `1.5px solid rgba(${hexToRgb(scoreColor)},0.35)`,
          boxShadow: `0 0 20px rgba(${hexToRgb(scoreColor)},0.1)`,
        }}
      >
        {/* Overall bar */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: 'Space Grotesk', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Overall Day Score
          </p>
          <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative' }}>
            <motion.div
              style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                borderRadius: 99,
                background: `linear-gradient(90deg, ${scoreColor}55, ${scoreColor})`,
                boxShadow: `0 0 12px ${scoreColor}80`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(overall / 10) * 100}%` }}
              transition={{ duration: 1.1, ease: 'easeOut', delay: 0.5 }}
            />
          </div>
        </div>

        {/* Big number */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <motion.div
            style={{ fontFamily: 'JetBrains Mono', fontWeight: 900, fontSize: 36, color: scoreColor, lineHeight: 1 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.45 }}
          >
            {overall}
          </motion.div>
          <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor, fontFamily: 'Space Grotesk', marginTop: 3, opacity: 0.85 }}>
            {getScoreLabel(overall)}
          </div>
        </div>
      </div>

    </div>
  );
}
