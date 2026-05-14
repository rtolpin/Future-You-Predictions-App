import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

const MOODS = [
  { id: 'motivated', icon: '🚀', label: 'Motivated',  color: '#00d4b1', rgb: '0,212,177'   },
  { id: 'hopeful',   icon: '🌅', label: 'Hopeful',    color: '#f59e0b', rgb: '245,158,11'  },
  { id: 'happy',     icon: '😊', label: 'Happy',      color: '#34d399', rgb: '52,211,153'  },
  { id: 'excited',   icon: '✨', label: 'Excited',    color: '#e879f9', rgb: '232,121,249' },
  { id: 'calm',      icon: '🧘', label: 'Calm',       color: '#60a5fa', rgb: '96,165,250'  },
  { id: 'anxious',   icon: '😰', label: 'Anxious',    color: '#f87171', rgb: '248,113,113' },
  { id: 'stressed',  icon: '😤', label: 'Stressed',   color: '#fb923c', rgb: '251,146,60'  },
  { id: 'sad',       icon: '😢', label: 'Sad',        color: '#818cf8', rgb: '129,140,248' },
  { id: 'exhausted', icon: '😴', label: 'Exhausted',  color: '#94a3b8', rgb: '148,163,184' },
  { id: 'numb',      icon: '😶', label: 'Numb',       color: '#64748b', rgb: '100,116,139' },
];

export function MoodStarterSelector({ selected, onChange }) {
  const [showInput, setShowInput]   = useState(false);
  const [customText, setCustomText] = useState('');
  const inputRef = useRef(null);

  const isCustom = selected && !MOODS.find(m => m.id === selected);
  const active   = MOODS.find(m => m.id === selected);

  const toggle = (id) => onChange(selected === id ? null : id);

  const confirmCustom = () => {
    const text = customText.trim();
    if (text) onChange(text);
    setCustomText('');
    setShowInput(false);
  };

  return (
    <div style={{ padding: '10px 14px 11px' }}>

      {/* Scrollable pill row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 1,
        }}
      >
        {MOODS.map((mood) => {
          const isOn = selected === mood.id;
          return (
            <motion.button
              key={mood.id}
              onClick={() => toggle(mood.id)}
              whileHover={{ y: -1, boxShadow: `0 4px 14px rgba(${mood.rgb},0.25)` }}
              whileTap={{ scale: 0.94 }}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 13px', borderRadius: 20, cursor: 'pointer',
                background: isOn
                  ? `linear-gradient(135deg, rgba(${mood.rgb},0.22), rgba(${mood.rgb},0.1))`
                  : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${isOn ? mood.color : 'rgba(255,255,255,0.1)'}`,
                boxShadow: isOn ? `0 0 12px rgba(${mood.rgb},0.28)` : 'none',
                transition: 'background 0.15s, border 0.15s, box-shadow 0.15s',
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>{mood.icon}</span>
              <span style={{
                fontSize: 12, fontWeight: isOn ? 700 : 500,
                color: isOn ? mood.color : '#94a3b8',
                fontFamily: 'Space Grotesk', whiteSpace: 'nowrap',
              }}>
                {mood.label}
              </span>
            </motion.button>
          );
        })}

        {/* Custom mood pill (when active) */}
        {isCustom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(167,139,250,0.22), rgba(167,139,250,0.1))', border: '1.5px solid #a78bfa', boxShadow: '0 0 12px rgba(167,139,250,0.28)' }}
          >
            <span style={{ fontSize: 15 }}>🎨</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', fontFamily: 'Space Grotesk', whiteSpace: 'nowrap' }}>{selected}</span>
            <button onClick={() => onChange(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', display: 'flex', alignItems: 'center', padding: 0, marginLeft: 2 }}>
              <X size={11} />
            </button>
          </motion.div>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', flexShrink: 0, marginLeft: 2 }} />

        {/* Custom input */}
        <AnimatePresence>
          {showInput ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, overflow: 'hidden' }}
            >
              <input
                ref={inputRef}
                autoFocus
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmCustom();
                  if (e.key === 'Escape') { setShowInput(false); setCustomText(''); }
                }}
                placeholder="e.g. Nostalgic…"
                maxLength={24}
                style={{
                  width: 130, padding: '5px 10px', borderRadius: 20, fontSize: 12,
                  background: 'rgba(167,139,250,0.1)', border: '1.5px solid rgba(167,139,250,0.45)',
                  color: '#f1f5f9', fontFamily: 'DM Sans', outline: 'none',
                }}
              />
              <motion.button
                onClick={confirmCustom} disabled={!customText.trim()}
                whileTap={{ scale: 0.93 }}
                style={{ flexShrink: 0, padding: '5px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'Space Grotesk', cursor: customText.trim() ? 'pointer' : 'not-allowed', background: customText.trim() ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${customText.trim() ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'}`, color: customText.trim() ? '#a78bfa' : '#475569' }}
              >
                Add
              </motion.button>
              <button onClick={() => { setShowInput(false); setCustomText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                <X size={12} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50); }}
              whileHover={{ borderColor: 'rgba(167,139,250,0.45)', color: '#a78bfa', background: 'rgba(167,139,250,0.08)' }}
              whileTap={{ scale: 0.93 }}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 20, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(255,255,255,0.15)', color: '#64748b', fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, transition: 'all 0.15s' }}
            >
              <Plus size={11} /> Custom
            </motion.button>
          )}
        </AnimatePresence>

        {/* Clear */}
        {selected && !showInput && (
          <button
            onClick={() => onChange(null)}
            style={{ flexShrink: 0, fontSize: 11, color: '#475569', cursor: 'pointer', background: 'none', border: 'none', padding: '0 4px', fontFamily: 'DM Sans', transition: 'color 0.15s' }}
            onMouseEnter={e => e.target.style.color = '#94a3b8'}
            onMouseLeave={e => e.target.style.color = '#475569'}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
