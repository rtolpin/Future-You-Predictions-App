import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles } from 'lucide-react';

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

export { MOODS };

export function MoodPickerModal({ current, onConfirm, onClose }) {
  const isCustomStart  = current && !MOODS.find(m => m.id === current);
  const [picked, setPicked]       = useState(current || null);
  const [customText, setCustomText] = useState(isCustomStart ? current : '');
  const [showCustom, setShowCustom] = useState(isCustomStart);
  const inputRef = useRef(null);

  const isCustomActive = picked && !MOODS.find(m => m.id === picked);
  const activeEntry    = MOODS.find(m => m.id === picked);

  const handleConfirm = () => {
    onConfirm(picked || null);
    onClose();
  };

  const handleCustomConfirm = () => {
    const t = customText.trim();
    if (t) { setPicked(t); }
    setShowCustom(false);
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: 24, zIndex: 9999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        style={{ width: '100%', maxWidth: 480, borderRadius: 22, overflow: 'hidden', background: 'linear-gradient(160deg,#0e0e1c,#09090f)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              🎭
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>Starting Mood</h3>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'DM Sans' }}>How are you starting your day?</p>
            </div>
          </div>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={15} />
          </motion.button>
        </div>

        {/* Mood grid */}
        <div style={{ padding: '18px 24px 8px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {MOODS.map(mood => {
            const isOn = picked === mood.id;
            return (
              <motion.button
                key={mood.id}
                onClick={() => { setPicked(isOn ? null : mood.id); setShowCustom(false); setCustomText(''); }}
                whileHover={{ y: -2, boxShadow: `0 6px 18px rgba(${mood.rgb},0.3)` }}
                whileTap={{ scale: 0.93 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 8px', borderRadius: 14, cursor: 'pointer',
                  background: isOn
                    ? `linear-gradient(135deg, rgba(${mood.rgb},0.25), rgba(${mood.rgb},0.1))`
                    : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${isOn ? mood.color : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isOn ? `0 0 16px rgba(${mood.rgb},0.25)` : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{mood.icon}</span>
                <span style={{ fontSize: 11, fontWeight: isOn ? 700 : 500, color: isOn ? mood.color : '#94a3b8', fontFamily: 'Space Grotesk', textAlign: 'center', lineHeight: 1.2 }}>
                  {mood.label}
                </span>
                {isOn && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{ width: 16, height: 16, borderRadius: '50%', background: mood.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#000', fontWeight: 900 }}>
                    ✓
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Custom mood */}
        <div style={{ padding: '8px 24px 20px' }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

          {isCustomActive && !showCustom && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(167,139,250,0.12)', border: '1.5px solid rgba(167,139,250,0.4)', marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>🎨</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#a78bfa', fontFamily: 'Space Grotesk' }}>{picked}</span>
              <button onClick={() => { setPicked(null); setCustomText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', display: 'flex' }}>
                <X size={13} />
              </button>
            </motion.div>
          )}

          {showCustom ? (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef} autoFocus
                value={customText} onChange={e => setCustomText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCustomConfirm(); if (e.key === 'Escape') setShowCustom(false); }}
                placeholder="e.g. Nostalgic, Giddy, Restless…"
                maxLength={32}
                style={{ flex: 1, padding: '9px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(167,139,250,0.09)', border: '1.5px solid rgba(167,139,250,0.4)', color: '#f1f5f9', fontFamily: 'DM Sans', outline: 'none' }}
              />
              <motion.button onClick={handleCustomConfirm} disabled={!customText.trim()} whileTap={{ scale: 0.95 }}
                style={{ padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk', cursor: customText.trim() ? 'pointer' : 'not-allowed', background: customText.trim() ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${customText.trim() ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'}`, color: customText.trim() ? '#a78bfa' : '#475569' }}>
                Add
              </motion.button>
              <button onClick={() => setShowCustom(false)} style={{ padding: '9px 10px', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
                <X size={14} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => { setShowCustom(true); setPicked(null); setTimeout(() => inputRef.current?.focus(), 50); }}
              whileHover={{ borderColor: 'rgba(167,139,250,0.4)', color: '#a78bfa', background: 'rgba(167,139,250,0.07)' }}
              whileTap={{ scale: 0.96 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(255,255,255,0.15)', color: '#64748b', fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600, transition: 'all 0.15s', width: '100%', justifyContent: 'center' }}
            >
              <Plus size={13} /> Enter a custom mood
            </motion.button>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#64748b', fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk', cursor: 'pointer' }}>
            Cancel
          </button>
          <motion.button onClick={handleConfirm}
            whileHover={{ boxShadow: '0 0 22px rgba(245,158,11,0.4)' }} whileTap={{ scale: 0.97 }}
            style={{ flex: 2, padding: '11px', borderRadius: 12, border: 'none', background: picked ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'rgba(255,255,255,0.07)', color: picked ? '#000' : '#475569', fontSize: 13, fontWeight: 800, fontFamily: 'Space Grotesk', cursor: 'pointer', boxShadow: picked ? '0 0 16px rgba(245,158,11,0.3)' : 'none', transition: 'all 0.2s' }}>
            {picked ? `Set Mood — ${MOODS.find(m => m.id === picked)?.label ?? picked}` : 'Confirm'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
