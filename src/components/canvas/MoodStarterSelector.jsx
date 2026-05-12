import { motion } from 'framer-motion';

const MOODS = [
  { id: 'motivated', icon: '🚀', label: 'Motivated',   color: '#00d4b1', rgb: '0,212,177' },
  { id: 'hopeful',   icon: '🌅', label: 'Hopeful',     color: '#f59e0b', rgb: '245,158,11' },
  { id: 'anxious',   icon: '😰', label: 'Anxious',     color: '#f87171', rgb: '248,113,113' },
  { id: 'exhausted', icon: '😴', label: 'Exhausted',   color: '#60a5fa', rgb: '96,165,250' },
  { id: 'numb',      icon: '😶', label: 'Numb',        color: '#94a3b8', rgb: '148,163,184' },
  { id: 'happy',     icon: '😊', label: 'Happy',       color: '#34d399', rgb: '52,211,153' },
  { id: 'excited',   icon: '✨', label: 'Excited',     color: '#e879f9', rgb: '232,121,249' },
  { id: 'stressed',  icon: '😤', label: 'Stressed',    color: '#fb923c', rgb: '251,146,60' },
  { id: 'calm',      icon: '🧘', label: 'Calm',        color: '#34d399', rgb: '52,211,153' },
];

export function MoodStarterSelector({ selected, onChange }) {
  const toggle = (id) => onChange(selected === id ? null : id);
  const active = MOODS.find(m => m.id === selected);

  return (
    <div
      className="shrink-0 flex items-center"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.25)',
        padding: '8px 16px',
        gap: 12,
        minHeight: 48,
      }}
    >
      {/* Label pill */}
      <div
        className="shrink-0 flex flex-col items-center text-center"
        style={{
          gap: 5, padding: '8px 10px', borderRadius: 12, minWidth: 74,
          background: `rgba(${active ? active.rgb : '245,158,11'},0.1)`,
          border: `1px solid rgba(${active ? active.rgb : '245,158,11'},0.25)`,
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>🎭</span>
        <p style={{ fontSize: 10, fontWeight: 800, color: active ? active.color : '#f59e0b', fontFamily: 'Space Grotesk', letterSpacing: '0.04em', lineHeight: 1.2, transition: 'color 0.3s' }}>
          Starting Mood
        </p>
        {selected ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onChange(null)}
            style={{ fontSize: 9, color: '#475569', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'DM Sans' }}
            onMouseEnter={e => e.target.style.color = '#94a3b8'}
            onMouseLeave={e => e.target.style.color = '#475569'}
          >
            Clear
          </motion.button>
        ) : (
          <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.3, fontFamily: 'DM Sans' }}>Pick one</p>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Mood chips */}
      <div className="flex items-center flex-wrap" style={{ gap: 6, flex: 1 }}>
        {MOODS.map((mood, i) => {
          const isOn = selected === mood.id;
          return (
            <motion.button
              key={mood.id}
              onClick={() => toggle(mood.id)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.94 }}
              className="shrink-0 flex items-center cursor-pointer transition-all"
              style={{
                gap: 6,
                padding: '5px 12px',
                borderRadius: 20,
                background: isOn ? `rgba(${mood.rgb},0.22)` : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isOn ? mood.color : 'rgba(255,255,255,0.09)'}`,
                boxShadow: isOn ? `0 0 12px rgba(${mood.rgb},0.3)` : 'none',
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{mood.icon}</span>
              <span style={{
                fontSize: 12,
                fontWeight: isOn ? 700 : 500,
                color: isOn ? mood.color : '#94a3b8',
                fontFamily: 'Space Grotesk',
              }}>
                {mood.label}
              </span>
              {isOn && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: mood.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#000', fontWeight: 900,
                  }}
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
