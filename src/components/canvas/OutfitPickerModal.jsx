import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus } from 'lucide-react';

// Custom outfit IDs are prefixed so they can be distinguished from preset IDs
export const CUSTOM_OUTFIT_PREFIX = 'custom:';
export const isCustomOutfit = (id) => id?.startsWith(CUSTOM_OUTFIT_PREFIX);
export const customOutfitLabel = (id) => id?.slice(CUSTOM_OUTFIT_PREFIX.length) ?? '';

const OUTFIT_GROUPS = [
  {
    col: 'left',
    label: 'Casual',
    emoji: '👕',
    color: '#34d399', rgb: '52,211,153',
    items: [
      { id: 'sweats',        icon: '👕', label: 'Sweatpants & Hoodie' },
      { id: 'jeans',         icon: '👖', label: 'Jeans & T-shirt' },
      { id: 'tshirt-shorts', icon: '🩳', label: 'T-Shirt & Shorts' },
      { id: 'loungewear',    icon: '🧸', label: 'Loungewear' },
      { id: 'sweater-pants', icon: '🧥', label: 'Sweater & Pants' },
    ],
  },
  {
    col: 'left',
    label: 'Active & Sport',
    emoji: '🏅',
    color: '#38bdf8', rgb: '56,189,248',
    items: [
      { id: 'athletic',     icon: '🏅', label: 'Athletic Wear' },
      { id: 'bathing-suit', icon: '👙', label: 'Bathing Suit / Bikini' },
      { id: 'swim-trunks',  icon: '🩲', label: 'Swimming Trunks' },
    ],
  },
  {
    col: 'left',
    label: 'At Home',
    emoji: '🛌',
    color: '#94a3b8', rgb: '148,163,184',
    items: [
      { id: 'pajamas',  icon: '🛌', label: 'Pajamas' },
      { id: 'bathrobe', icon: '🩱', label: 'Bath Robe' },
    ],
  },
  {
    col: 'right',
    label: 'Going Out',
    emoji: '✨',
    color: '#e879f9', rgb: '232,121,249',
    items: [
      { id: 'going-out',   icon: '✨', label: 'Going-Out Outfit' },
      { id: 'cute-dress',  icon: '👗', label: 'Cute Dress' },
      { id: 'shirt-skirt', icon: '🌸', label: 'Shirt & Skirt' },
      { id: 'creative',    icon: '🎨', label: 'Creative / Expressive' },
    ],
  },
  {
    col: 'right',
    label: 'Professional',
    emoji: '👔',
    color: '#f59e0b', rgb: '245,158,11',
    items: [
      { id: 'business', icon: '👔', label: 'Business Casual' },
      { id: 'formal',   icon: '🎩', label: 'Formal / Dressed Up' },
      { id: 'uniform',  icon: '🎽', label: 'Uniform' },
    ],
  },
];

export { OUTFIT_GROUPS };

const ACCENT = '#a78bfa';
const ACCENT_RGB = '167,139,250';

function OutfitCard({ outfit, isOn, onToggle }) {
  return (
    <motion.button
      onClick={() => onToggle(outfit.id)}
      whileHover={{ y: -1, boxShadow: isOn ? `0 4px 14px rgba(${ACCENT_RGB},0.3)` : '0 2px 8px rgba(0,0,0,0.35)' }}
      whileTap={{ scale: 0.96 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%',
        background: isOn
          ? `linear-gradient(135deg, rgba(${ACCENT_RGB},0.18), rgba(${ACCENT_RGB},0.07))`
          : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${isOn ? `rgba(${ACCENT_RGB},0.5)` : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isOn ? `0 0 12px rgba(${ACCENT_RGB},0.18)` : 'none',
        transition: 'background 0.15s, border 0.15s',
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{outfit.icon}</span>
      <span style={{
        flex: 1, fontSize: 13, fontWeight: isOn ? 700 : 400,
        color: isOn ? '#e2e8f0' : '#94a3b8',
        fontFamily: 'Space Grotesk', lineHeight: 1.3,
      }}>
        {outfit.label}
      </span>
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${isOn ? ACCENT : 'rgba(255,255,255,0.18)'}`,
        background: isOn ? ACCENT : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {isOn && <Check size={11} color="#000" strokeWidth={3} />}
      </div>
    </motion.button>
  );
}

function GroupSection({ group, picked, onToggle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `rgba(${group.rgb},0.15)`, border: `1px solid rgba(${group.rgb},0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
          {group.emoji}
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: `rgba(${group.rgb},0.85)`, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {group.label}
        </span>
        {group.items.some(i => picked.includes(i.id)) && (
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: ACCENT, fontFamily: 'Space Grotesk', background: `rgba(${ACCENT_RGB},0.12)`, border: `1px solid rgba(${ACCENT_RGB},0.3)`, borderRadius: 20, padding: '1px 7px' }}>
            {group.items.filter(i => picked.includes(i.id)).length} selected
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {group.items.map(outfit => (
          <OutfitCard key={outfit.id} outfit={outfit} isOn={picked.includes(outfit.id)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

export function OutfitPickerModal({ current, onConfirm, onClose }) {
  const [picked, setPicked]         = useState([...(current || [])]);
  const [customText, setCustomText] = useState('');
  const inputRef = useRef(null);

  const toggle = (id) =>
    setPicked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const addCustom = () => {
    const text = customText.trim();
    if (!text) return;
    const id = `${CUSTOM_OUTFIT_PREFIX}${text}`;
    if (!picked.includes(id)) setPicked(prev => [...prev, id]);
    setCustomText('');
    inputRef.current?.focus();
  };

  const handleConfirm = () => { onConfirm(picked); onClose(); };

  const leftGroups  = OUTFIT_GROUPS.filter(g => g.col === 'left');
  const rightGroups = OUTFIT_GROUPS.filter(g => g.col === 'right');

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', padding: '24px', zIndex: 9999, overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          width: '100%', maxWidth: 820,
          borderRadius: 24, overflow: 'hidden',
          background: 'linear-gradient(160deg, #0f0f1e 0%, #09090f 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(167,139,250,0.06)',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '22px 28px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: `rgba(${ACCENT_RGB},0.04)`,
        }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: `rgba(${ACCENT_RGB},0.15)`, border: `1.5px solid rgba(${ACCENT_RGB},0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: `0 0 18px rgba(${ACCENT_RGB},0.2)` }}>
            👗
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>
              Today's Outfit
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontFamily: 'DM Sans' }}>
              Select everything you're wearing — multiple selections allowed
            </p>
          </div>
          <AnimatePresence>
            {picked.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: ACCENT, fontFamily: 'Space Grotesk', background: `rgba(${ACCENT_RGB},0.15)`, border: `1px solid rgba(${ACCENT_RGB},0.35)`, borderRadius: 20, padding: '4px 12px' }}>
                  {picked.length} selected
                </span>
                <button onClick={() => setPicked([])}
                  style={{ fontSize: 11, color: '#475569', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 6px', fontFamily: 'DM Sans', transition: 'color 0.15s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.target.style.color = '#f87171'}
                  onMouseLeave={e => e.target.style.color = '#475569'}>
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.9 }}
            style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
            <X size={16} />
          </motion.button>
        </div>

        {/* ── Scrollable body: two columns + custom at the very bottom ── */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Two-column outfit grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* Left column */}
            <div style={{ padding: '20px 16px 20px 28px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              {leftGroups.map(group => (
                <GroupSection key={group.label} group={group} picked={picked} onToggle={toggle} />
              ))}
            </div>
            {/* Right column */}
            <div style={{ padding: '20px 28px 20px 16px' }}>
              {rightGroups.map(group => (
                <GroupSection key={group.label} group={group} picked={picked} onToggle={toggle} />
              ))}
            </div>
          </div>

          {/* ── Custom outfit — visible only when scrolled to bottom ── */}
          <div style={{ padding: '18px 28px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(167,139,250,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Plus size={12} color="rgba(167,139,250,0.7)" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(167,139,250,0.7)', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Custom Outfit
              </span>
              <span style={{ fontSize: 11, color: '#334155', fontFamily: 'DM Sans' }}>— type anything you're wearing</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                ref={inputRef}
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCustom(); }}
                placeholder="e.g. Black turtleneck & slacks, Vintage denim jacket…"
                maxLength={60}
                style={{
                  flex: 1, padding: '9px 14px', borderRadius: 10, fontSize: 13,
                  background: 'rgba(167,139,250,0.07)', border: '1.5px solid rgba(167,139,250,0.25)',
                  color: '#f1f5f9', fontFamily: 'DM Sans', outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.55)'}
                onBlur={e => e.target.style.borderColor = 'rgba(167,139,250,0.25)'}
              />
              <motion.button
                onClick={addCustom} disabled={!customText.trim()}
                whileHover={customText.trim() ? { scale: 1.05, boxShadow: '0 0 14px rgba(167,139,250,0.4)' } : {}}
                whileTap={customText.trim() ? { scale: 0.95 } : {}}
                style={{
                  padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 800,
                  fontFamily: 'Space Grotesk', cursor: customText.trim() ? 'pointer' : 'not-allowed',
                  background: customText.trim() ? 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(144,97,249,0.2))' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${customText.trim() ? 'rgba(167,139,250,0.55)' : 'rgba(255,255,255,0.09)'}`,
                  color: customText.trim() ? '#c4b5fd' : '#334155',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>
                + Add
              </motion.button>
            </div>

            {/* Added custom outfit chips */}
            {picked.filter(isCustomOutfit).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {picked.filter(isCustomOutfit).map(id => (
                  <motion.div key={id} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', borderRadius: 20, background: 'rgba(167,139,250,0.15)', border: '1.5px solid rgba(167,139,250,0.4)' }}>
                    <span style={{ fontSize: 13 }}>✏️</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd', fontFamily: 'Space Grotesk' }}>
                      {customOutfitLabel(id)}
                    </span>
                    <button onClick={() => toggle(id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', display: 'flex', alignItems: 'center', padding: 0, marginLeft: 2 }}>
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 28px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
          <button onClick={onClose}
            style={{ padding: '11px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#64748b', fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.09)'; e.target.style.color = '#94a3b8'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#64748b'; }}>
            Cancel
          </button>
          <motion.button onClick={handleConfirm}
            whileHover={picked.length > 0 ? { scale: 1.02, boxShadow: `0 0 28px rgba(${ACCENT_RGB},0.5)` } : {}}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: picked.length > 0 ? `linear-gradient(135deg, ${ACCENT}, #9061f9)` : 'rgba(255,255,255,0.07)',
              color: picked.length > 0 ? '#fff' : '#475569',
              fontSize: 14, fontWeight: 800, fontFamily: 'Space Grotesk',
              boxShadow: picked.length > 0 ? `0 0 20px rgba(${ACCENT_RGB},0.35)` : 'none',
              transition: 'all 0.2s',
            }}>
            {picked.length > 0
              ? `✓ Confirm ${picked.length} outfit${picked.length !== 1 ? 's' : ''}`
              : 'Select outfits above'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
