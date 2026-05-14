import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Target, Zap, Check, Sparkles } from 'lucide-react';

const ACCENT       = '#00d4b1';
const ACCENT_RGB   = '0,212,177';
const BUILD_COLOR  = '#34d399';
const BUILD_RGB    = '52,211,153';
const BREAK_COLOR  = '#f87171';
const BREAK_RGB    = '248,113,113';
const CUSTOM_COLOR = '#a78bfa';
const CUSTOM_RGB   = '167,139,250';

const BUILD_TEMPLATES = [
  { emoji: '🏃', text: 'Exercise for at least 30 minutes' },
  { emoji: '💧', text: 'Drink 8 glasses of water' },
  { emoji: '📚', text: 'Read for 20 minutes' },
  { emoji: '🧘', text: 'Meditate for 10 minutes' },
  { emoji: '🛏️', text: 'Be in bed by 10 PM' },
  { emoji: '🥗', text: 'Eat a healthy meal' },
  { emoji: '📝', text: 'Journal for 5 minutes' },
  { emoji: '☀️', text: 'Get outside for fresh air' },
  { emoji: '💤', text: 'Sleep 7–8 hours' },
  { emoji: '🤝', text: 'Reach out to someone I care about' },
  { emoji: '🎯', text: 'Work on my side project' },
  { emoji: '🧹', text: 'Tidy up my space' },
  { emoji: '🚫🍺', text: 'No alcohol today' },
  { emoji: '🍳', text: 'Cook instead of ordering out' },
];

const BREAK_TEMPLATES = [
  { emoji: '📱', text: 'Limit social media to 1 hour' },
  { emoji: '☕', text: 'Limit caffeine to 1 cup' },
  { emoji: '🍕', text: 'No junk food today' },
  { emoji: '📺', text: 'No more than 2 hours of TV' },
  { emoji: '😴', text: 'No oversleeping past 9 AM' },
  { emoji: '🌙', text: 'No doom-scrolling before bed' },
  { emoji: '💸', text: 'No impulse purchases' },
  { emoji: '📲', text: 'No phone before 9 AM' },
  { emoji: '🍦', text: 'No sugar today' },
  { emoji: '🥤', text: 'No soda today' },
  { emoji: '😤', text: 'No complaining today' },
  { emoji: '🚬', text: 'No smoking today' },
];

const EMOJI_OPTIONS = [
  '🎯','🏃','💧','📚','🧘','🛏️','🥗','📝','☀️','💤',
  '🤝','🧹','🍳','💼','🎸','🏋️','💅','🚴','🎨','🌿',
  '📱','☕','🍕','📺','😴','💸','📲','🍦','🥤','🌙',
  '😤','🚬','🍺','🍰','⭐','🔥','💡','🎵','✈️','🧠',
];

function EmojiPickerModal({ selected, onSelect, onClose, anchorRef }) {
  const [pasteValue, setPasteValue] = useState('');

  const confirmPaste = () => {
    const v = pasteValue.trim();
    if (v) { onSelect(v); onClose(); }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        style={{
          width: 340, borderRadius: 18, overflow: 'hidden',
          background: 'linear-gradient(160deg,#0f0f1e,#09090f)',
          border: '1px solid rgba(167,139,250,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: `rgba(167,139,250,0.9)`, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Choose Icon
          </span>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={13} />
          </motion.button>
        </div>

        {/* Emoji grid */}
        <div style={{ padding: '12px 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EMOJI_OPTIONS.map(em => (
            <motion.button
              key={em}
              onClick={() => { onSelect(em); onClose(); }}
              whileHover={{ scale: 1.18, background: 'rgba(167,139,250,0.22)' }}
              whileTap={{ scale: 0.88 }}
              style={{
                width: 34, height: 34, borderRadius: 9, fontSize: 17,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                background: selected === em ? 'rgba(167,139,250,0.22)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${selected === em ? 'rgba(167,139,250,0.6)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'background 0.12s, border 0.12s',
              }}>
              {em}
            </motion.button>
          ))}
        </div>

        {/* Paste custom emoji */}
        <div style={{ padding: '8px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
          <p style={{ fontSize: 10, color: '#475569', fontFamily: 'DM Sans', marginBottom: 7 }}>Or paste any emoji:</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus={false}
              value={pasteValue}
              onChange={e => setPasteValue(e.target.value.slice(0, 2))}
              onKeyDown={e => { if (e.key === 'Enter') confirmPaste(); }}
              placeholder="Paste emoji…"
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: 14,
                background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(167,139,250,0.2)',
                color: '#f1f5f9', fontFamily: 'DM Sans', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(167,139,250,0.2)'}
            />
            <motion.button onClick={confirmPaste} disabled={!pasteValue.trim()}
              whileTap={{ scale: 0.94 }}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                fontFamily: 'Space Grotesk', cursor: pasteValue.trim() ? 'pointer' : 'not-allowed',
                background: pasteValue.trim() ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${pasteValue.trim() ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: pasteValue.trim() ? '#c4b5fd' : '#334155',
              }}>
              Use
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

function CustomGoalModal({ onAdd, onClose }) {
  const [text, setText]             = useState('');
  const [type, setType]             = useState('build');
  const [emoji, setEmoji]           = useState('🎯');
  const [showEmoji, setShowEmoji]   = useState(false);

  const handleSubmit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd({ id: `goal-${Date.now()}`, text: t, emoji, type });
    onClose();
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99998, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 14 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        style={{
          width: '100%', maxWidth: 440, borderRadius: 20, overflow: 'hidden',
          background: 'linear-gradient(160deg, #0f0f1e 0%, #09090f 100%)',
          border: '1px solid rgba(167,139,250,0.2)',
          boxShadow: '0 28px 70px rgba(0,0,0,0.75)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(167,139,250,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(167,139,250,0.15)', border: '1.5px solid rgba(167,139,250,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(167,139,250,0.2)' }}>
              <Sparkles size={17} color={CUSTOM_COLOR} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>Add Custom Goal</h3>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'DM Sans' }}>Create your own habit goal</p>
            </div>
          </div>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={14} />
          </motion.button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Build / Break */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['build', 'break'].map(t => (
              <motion.button key={t} onClick={() => setType(t)} whileTap={{ scale: 0.96 }}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk',
                  border: `1.5px solid ${type === t ? (t === 'build' ? `rgba(${BUILD_RGB},0.55)` : `rgba(${BREAK_RGB},0.55)`) : 'rgba(255,255,255,0.09)'}`,
                  background: type === t ? (t === 'build' ? `rgba(${BUILD_RGB},0.14)` : `rgba(${BREAK_RGB},0.12)`) : 'rgba(255,255,255,0.04)',
                  color: type === t ? (t === 'build' ? BUILD_COLOR : BREAK_COLOR) : '#64748b',
                  transition: 'all 0.15s',
                }}>
                {t === 'build' ? '✅ Build Good Habit' : '🚫 Break Bad Habit'}
              </motion.button>
            ))}
          </div>

          {/* Emoji + Goal text */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <motion.button
              onClick={() => setShowEmoji(true)}
              whileHover={{ scale: 1.08, borderColor: 'rgba(167,139,250,0.6)' }}
              whileTap={{ scale: 0.93 }}
              title="Choose icon"
              style={{ width: 46, height: 46, borderRadius: 12, fontSize: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(167,139,250,0.12)', border: '1.5px solid rgba(167,139,250,0.35)', transition: 'all 0.15s' }}
            >
              {emoji}
            </motion.button>
            <input
              autoFocus
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="Describe your goal…"
              maxLength={60}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 11, fontSize: 14,
                background: 'rgba(255,255,255,0.06)', border: `1.5px solid rgba(${CUSTOM_RGB},0.25)`,
                color: '#f1f5f9', fontFamily: 'DM Sans', outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = `rgba(${CUSTOM_RGB},0.6)`; e.target.style.boxShadow = `0 0 0 2px rgba(${CUSTOM_RGB},0.1)`; }}
              onBlur={e => { e.target.style.borderColor = `rgba(${CUSTOM_RGB},0.25)`; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', fontFamily: 'Space Grotesk', marginTop: -8, textShadow: '0 0 10px rgba(251,191,36,0.4)' }}>
            ✨ Tap the icon to choose an emoji
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '0 24px 22px' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#64748b', fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk', cursor: 'pointer' }}>
            Cancel
          </button>
          <motion.button onClick={handleSubmit} disabled={!text.trim()}
            whileHover={text.trim() ? { scale: 1.03, boxShadow: '0 0 22px rgba(167,139,250,0.45)' } : {}}
            whileTap={text.trim() ? { scale: 0.97 } : {}}
            style={{
              flex: 2, padding: '11px', borderRadius: 12, border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
              background: text.trim() ? `linear-gradient(135deg, ${CUSTOM_COLOR}, #9061f9)` : 'rgba(255,255,255,0.07)',
              color: text.trim() ? '#fff' : '#475569',
              fontSize: 13, fontWeight: 800, fontFamily: 'Space Grotesk',
              boxShadow: text.trim() ? '0 0 16px rgba(167,139,250,0.3)' : 'none',
              transition: 'all 0.2s',
            }}>
            {text.trim() ? `✓ Add "${text.trim().slice(0, 24)}${text.trim().length > 24 ? '…' : ''}"` : 'Add Goal'}
          </motion.button>
        </div>
      </motion.div>

      {/* Nested emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <EmojiPickerModal
            selected={emoji}
            onSelect={em => setEmoji(em)}
            onClose={() => setShowEmoji(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}

export function DayGoals({ isOpen, onClose, goals, onGoalsChange }) {
  const [templateTab, setTemplateTab]         = useState('build');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const activeIds = new Set(goals.map(g => g.text));

  const toggleTemplate = (tmpl, type) => {
    if (activeIds.has(tmpl.text)) {
      onGoalsChange(goals.filter(g => g.text !== tmpl.text));
    } else {
      onGoalsChange([...goals, { id: `goal-${Date.now()}`, text: tmpl.text, emoji: tmpl.emoji, type }]);
    }
  };

  const removeGoal = (id) => onGoalsChange(goals.filter(g => g.id !== id));

  const addCustomGoal = (goal) => {
    onGoalsChange([...goals, goal]);
  };

  const templates = templateTab === 'build' ? BUILD_TEMPLATES : BREAK_TEMPLATES;
  const tColor    = templateTab === 'build' ? BUILD_COLOR : BREAK_COLOR;
  const tRgb      = templateTab === 'build' ? BUILD_RGB   : BREAK_RGB;

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{    scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex flex-col w-full"
            style={{
              maxWidth: 920,
              height: '88vh',
              borderRadius: 24,
              overflow: 'hidden',
              background: 'linear-gradient(160deg, #0e0e1c 0%, #09090f 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,177,0.08)',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '22px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: `rgba(${ACCENT_RGB},0.04)`, flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: `rgba(${ACCENT_RGB},0.15)`,
                  border: `1.5px solid rgba(${ACCENT_RGB},0.35)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 20px rgba(${ACCENT_RGB},0.25)`,
                }}>
                  <Target size={22} color={ACCENT} />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>
                    Day Goals
                  </h2>
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                    Set your intentions — reflect on them at day's end with AI coaching
                  </p>
                </div>
              </div>
              <motion.button onClick={onClose} whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.9 }}
                style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <X size={16} />
              </motion.button>
            </div>

            {/* ── Add Custom Goal button ── */}
            <div style={{ padding: '10px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(167,139,250,0.03)', flexShrink: 0 }}>
              <motion.button
                onClick={() => setShowCustomModal(true)}
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(167,139,250,0.35)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 12, cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.08))',
                  border: '1.5px solid rgba(167,139,250,0.4)',
                  color: CUSTOM_COLOR, fontSize: 13, fontWeight: 800, fontFamily: 'Space Grotesk',
                  boxShadow: '0 0 12px rgba(167,139,250,0.15)',
                  transition: 'all 0.15s',
                }}
              >
                <Plus size={15} />
                + Add Custom Goal
              </motion.button>
            </div>

            {/* ── Two-column body ── */}
            <div className="flex flex-1 overflow-hidden">

              {/* ── LEFT: Active goals ── */}
              <div style={{
                width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
                borderRight: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(0,0,0,0.15)',
                overflow: 'hidden',
              }}>
                {/* Active goals header */}
                <div style={{ padding: '20px 24px 14px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 18, borderRadius: 2, background: ACCENT }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Today's Goals
                    </span>
                    {goals.length > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: ACCENT, fontFamily: 'Space Grotesk', background: `rgba(${ACCENT_RGB},0.15)`, border: `1px solid rgba(${ACCENT_RGB},0.3)`, borderRadius: 20, padding: '2px 8px' }}>
                        {goals.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Goals list */}
                <div className="flex-1 overflow-y-auto" style={{ padding: '0 16px 16px', minHeight: 0 }}>
                  {goals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
                      <p style={{ color: '#475569', fontSize: 13, fontFamily: 'DM Sans', lineHeight: 1.6 }}>
                        No goals yet.<br />Pick from the templates →
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <AnimatePresence>
                        {goals.map(g => (
                          <motion.div
                            key={g.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0 }}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 10,
                              padding: '13px 14px', borderRadius: 14,
                              background: g.type === 'build' ? `rgba(${BUILD_RGB},0.08)` : `rgba(${BREAK_RGB},0.08)`,
                              border: `1px solid ${g.type === 'build' ? `rgba(${BUILD_RGB},0.22)` : `rgba(${BREAK_RGB},0.22)`}`,
                            }}
                          >
                            <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2 }}>{g.emoji}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', fontFamily: 'DM Sans', lineHeight: 1.4 }}>{g.text}</p>
                              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.05em', color: g.type === 'build' ? BUILD_COLOR : BREAK_COLOR }}>
                                {g.type === 'build' ? '✅ Build' : '🚫 Break'}
                              </span>
                            </div>
                            <motion.button
                              onClick={() => removeGoal(g.id)}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid rgba(${BREAK_RGB},0.25)`, background: `rgba(${BREAK_RGB},0.1)`, color: BREAK_COLOR, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                              <X size={10} />
                            </motion.button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

              </div>

              {/* ── RIGHT: Template picker ── */}
              <div className="flex flex-col flex-1 overflow-hidden">

                {/* Build / Break tab row */}
                <div style={{ display: 'flex', gap: 10, padding: '20px 28px 16px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { id: 'build', label: '✅ Build Good Habits', color: BUILD_COLOR, rgb: BUILD_RGB },
                    { id: 'break', label: '🚫 Break Bad Habits',  color: BREAK_COLOR, rgb: BREAK_RGB },
                  ].map(t => {
                    const active = templateTab === t.id;
                    return (
                      <motion.button key={t.id} onClick={() => setTemplateTab(t.id)}
                        whileTap={{ scale: 0.96 }}
                        style={{
                          flex: 1, padding: '12px 20px', borderRadius: 14, cursor: 'pointer',
                          fontSize: 14, fontWeight: 800, fontFamily: 'Space Grotesk',
                          background: active ? `rgba(${t.rgb},0.14)` : 'rgba(255,255,255,0.04)',
                          border: `2px solid ${active ? `rgba(${t.rgb},0.45)` : 'rgba(255,255,255,0.08)'}`,
                          color: active ? t.color : '#475569',
                          boxShadow: active ? `0 0 18px rgba(${t.rgb},0.2)` : 'none',
                          transition: 'all 0.18s',
                        }}>
                        {t.label}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Helper text */}
                <div style={{ padding: '10px 28px 4px', flexShrink: 0 }}>
                  <p style={{ fontSize: 12, color: '#475569', fontFamily: 'DM Sans' }}>
                    {templateTab === 'build'
                      ? 'Click any habit to add it to today\'s goals. Click again to remove.'
                      : 'Select the habits you want to resist today. Click again to remove.'}
                  </p>
                </div>

                {/* Template grid */}
                <div className="flex-1 overflow-y-auto" style={{ padding: '12px 28px 24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {templates.map(tmpl => {
                      const on = activeIds.has(tmpl.text);
                      return (
                        <motion.button
                          key={tmpl.text}
                          onClick={() => toggleTemplate(tmpl, templateTab)}
                          whileHover={{ y: -2, boxShadow: on ? `0 6px 20px rgba(${tRgb},0.25)` : '0 4px 16px rgba(0,0,0,0.3)' }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                            background: on ? `rgba(${tRgb},0.13)` : 'rgba(255,255,255,0.04)',
                            border: `1.5px solid ${on ? `rgba(${tRgb},0.45)` : 'rgba(255,255,255,0.08)'}`,
                            boxShadow: on ? `0 0 14px rgba(${tRgb},0.18)` : 'none',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{tmpl.emoji}</span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: on ? 700 : 500, color: on ? '#f1f5f9' : '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.35 }}>
                            {tmpl.text}
                          </span>
                          <div style={{
                            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                            border: `2px solid ${on ? tColor : 'rgba(255,255,255,0.12)'}`,
                            background: on ? `rgba(${tRgb},0.2)` : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}>
                            {on && <Check size={11} color={tColor} strokeWidth={3} />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div style={{ padding: '16px 32px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'rgba(0,0,0,0.2)' }}>
              <p style={{ fontSize: 13, color: '#475569', fontFamily: 'DM Sans' }}>
                {goals.length === 0
                  ? 'Add goals above, then do your Day Retrospective at day\'s end for AI coaching.'
                  : `${goals.length} goal${goals.length !== 1 ? 's' : ''} set for today — revisit with Retrospective when your day is done.`}
              </p>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.03, boxShadow: `0 0 28px rgba(${ACCENT_RGB},0.45)` }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '13px 28px', borderRadius: 14, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: `linear-gradient(135deg, ${ACCENT}, #00c4a3)`,
                  boxShadow: `0 0 20px rgba(${ACCENT_RGB},0.3)`,
                  color: '#000', fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 800,
                }}>
                <Zap size={16} /> Save & Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Custom goal modal */}
    <AnimatePresence>
      {showCustomModal && (
        <CustomGoalModal
          onAdd={addCustomGoal}
          onClose={() => setShowCustomModal(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
