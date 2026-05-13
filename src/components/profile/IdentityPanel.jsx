import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Check, MapPin, Sparkles, Zap } from 'lucide-react';

const GENDER_OPTIONS = [
  { value: 'Man',              icon: '♂' },
  { value: 'Woman',            icon: '♀' },
  { value: 'Non-binary',       icon: '⚧' },
  { value: 'Prefer not to say',icon: '·' },
];

const AGE_OPTIONS = [
  { value: 'Teen (13-19)', icon: '🎒' },
  { value: '20s',          icon: '✨' },
  { value: '30s',          icon: '💫' },
  { value: '40s',          icon: '🌟' },
  { value: '50s',          icon: '🌅' },
  { value: '60s',          icon: '🌄' },
  { value: '70+',          icon: '🌇' },
];

const EMPLOYMENT_OPTIONS = [
  { value: 'Employed full-time', icon: '💼' },
  { value: 'Part-time',          icon: '⏱' },
  { value: 'Unemployed',         icon: '🔍' },
  { value: 'Student',            icon: '📚' },
  { value: 'Freelancer',         icon: '💻' },
  { value: 'Retired',            icon: '🌴' },
];

const MOOD_COLORS = ['#f87171','#fb923c','#fbbf24','#a3e635','#34d399','#22d3ee','#60a5fa','#818cf8','#c084fc','#e879f9'];
const MOOD_EMOJI  = ['😞','😕','😐','🙂','😊','😄','😁','🤩','✨','🌟'];

const ACCENT = '#00d4b1';
const ACCENT_RGB = '0,212,177';

function Section({ title, icon, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: `linear-gradient(180deg, ${ACCENT}, rgba(0,212,177,0.3))`, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {icon} {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function ChipGroup({ options, value, onChange, color = ACCENT, colorRgb = ACCENT_RGB }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const on = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 12, cursor: 'pointer',
              background: on ? `rgba(${colorRgb},0.18)` : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${on ? color : 'rgba(255,255,255,0.09)'}`,
              color: on ? color : '#94a3b8',
              fontSize: 13, fontWeight: on ? 700 : 500, fontFamily: 'Space Grotesk',
              boxShadow: on ? `0 0 14px rgba(${colorRgb},0.25)` : 'none',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>{opt.icon}</span>
            {opt.value}
            {on && <Check size={12} style={{ flexShrink: 0 }} />}
          </motion.button>
        );
      })}
    </div>
  );
}

function SliderField({ label, emoji, value, onChange, color, low, high }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', fontFamily: 'Space Grotesk' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 20 }}>{emoji}</span>
          <span style={{ fontSize: 24, fontWeight: 900, color, fontFamily: 'JetBrains Mono' }}>{value}</span>
          <span style={{ fontSize: 12, color: '#475569' }}>/ 10</span>
        </div>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#475569' }}>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function TextField({ label, icon, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon && <span style={{ color: '#64748b' }}>{icon}</span>}
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', fontFamily: 'Space Grotesk' }}>{label}</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.06)',
          border: '1.5px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          color: '#f1f5f9',
          fontFamily: 'DM Sans',
          fontSize: 15,
          padding: '14px 18px',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = `rgba(${ACCENT_RGB},0.6)`; e.target.style.boxShadow = `0 0 0 3px rgba(${ACCENT_RGB},0.12)`; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

export function IdentityPanel({ isOpen, onClose, profile, onUpdate }) {
  // Local state + ref so rapid updates (sliders, fast typing) never use a stale
  // snapshot of the profile prop — each update builds on the actual latest values.
  const localRef = useRef(profile || {});
  const [local, setLocal] = useState(() => profile || {});

  // Re-sync from parent whenever the panel is opened
  useEffect(() => {
    if (isOpen) {
      localRef.current = profile || {};
      setLocal(profile || {});
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((key, value) => {
    const next = { ...localRef.current, [key]: value };
    localRef.current = next;
    setLocal(next);
    onUpdate(next);
  }, [onUpdate]);

  const moodColor   = MOOD_COLORS[(local?.mood   || 5) - 1];
  const energyColor = MOOD_COLORS[(local?.energy || 5) - 1];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
            style={{
              width: 420,
              background: 'linear-gradient(160deg, #0d0d1a 0%, #09090f 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: `rgba(${ACCENT_RGB},0.05)`,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `rgba(${ACCENT_RGB},0.15)`,
                  border: `1.5px solid rgba(${ACCENT_RGB},0.3)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 16px rgba(${ACCENT_RGB},0.2)`,
                }}>
                  <User size={18} color={ACCENT} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>
                    Identity Panel
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1 }}>
                    Your context shapes every prediction
                  </p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
                style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '24px 24px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>

              <Section title="Your Name" icon="✍️">
                <TextField
                  value={local?.name || ''}
                  onChange={v => update('name', v)}
                  placeholder="What should I call you?"
                />
              </Section>

              <Section title="City / Neighborhood" icon="📍">
                <TextField
                  value={local?.city || ''}
                  onChange={v => update('city', v)}
                  placeholder="e.g. Brooklyn, NYC"
                />
              </Section>

              <Section title="Gender Identity" icon="🧬">
                <ChipGroup
                  options={GENDER_OPTIONS}
                  value={local?.genderIdentity}
                  onChange={v => update('genderIdentity', v)}
                />
              </Section>

              <Section title="Age Range" icon="🎂">
                <ChipGroup
                  options={AGE_OPTIONS}
                  value={local?.ageRange}
                  onChange={v => update('ageRange', v)}
                />
              </Section>

              <Section title="Employment" icon="💼">
                <ChipGroup
                  options={EMPLOYMENT_OPTIONS}
                  value={local?.employment}
                  onChange={v => update('employment', v)}
                />
              </Section>

              <Section title="Current Mood & Energy" icon="⚡">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <SliderField
                    label="Mood"
                    emoji={MOOD_EMOJI[(local?.mood || 5) - 1]}
                    value={local?.mood || 5}
                    onChange={v => update('mood', v)}
                    color={moodColor}
                    low="😞 Low"
                    high="🌟 High"
                  />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <SliderField
                    label="Energy"
                    emoji="⚡"
                    value={local?.energy || 5}
                    onChange={v => update('energy', v)}
                    color={energyColor}
                    low="😴 Drained"
                    high="🚀 Energized"
                  />
                </div>
              </Section>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02, boxShadow: `0 0 28px rgba(${ACCENT_RGB},0.45)` }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center cursor-pointer"
                style={{
                  gap: 8, padding: '15px', borderRadius: 16, border: 'none',
                  background: `linear-gradient(135deg, ${ACCENT}, #00c4a3)`,
                  boxShadow: `0 0 20px rgba(${ACCENT_RGB},0.3)`,
                  color: '#000', fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 800,
                  letterSpacing: '0.01em',
                }}
              >
                <Sparkles size={16} /> Save & Apply
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
