import { motion } from 'framer-motion';

const SECTIONS = [
  {
    key: 'scene',
    icon: '🌆',
    label: 'The Scene',
    accentColor: '#00d4b1',
    bg: 'rgba(0,212,177,0.13)',
    border: 'rgba(0,212,177,0.35)',
  },
  {
    key: 'immediateFeel',
    icon: '😌',
    label: "How You'll Feel",
    accentColor: '#c4b5fd',
    bg: 'rgba(167,139,250,0.13)',
    border: 'rgba(167,139,250,0.35)',
  },
  {
    key: 'endOfDayFeel',
    icon: '🌙',
    label: 'Tonight',
    accentColor: '#93c5fd',
    bg: 'rgba(96,165,250,0.13)',
    border: 'rgba(96,165,250,0.35)',
  },
  {
    key: 'rippleEffect',
    icon: '📅',
    label: 'Ripple Effect',
    accentColor: '#fcd34d',
    bg: 'rgba(245,158,11,0.13)',
    border: 'rgba(245,158,11,0.35)',
  },
];

export function SceneBlock({ scene, immediateFeel, endOfDayFeel, rippleEffect }) {
  const values = { scene, immediateFeel, endOfDayFeel, rippleEffect };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {SECTIONS.map(({ key, icon, label, accentColor, bg, border }, i) => {
        const text = values[key];
        if (!text) return null;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}
            style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}
          >
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 6px' }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
              <span style={{
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: accentColor,
                fontFamily: 'Space Grotesk',
              }}>
                {label}
              </span>
            </div>
            {/* Body text */}
            <div style={{ padding: '2px 14px 12px' }}>
              <p style={{
                fontSize: 13,
                color: '#e2e8f0',
                lineHeight: 1.7,
                fontFamily: 'DM Sans',
              }}>
                {text}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
