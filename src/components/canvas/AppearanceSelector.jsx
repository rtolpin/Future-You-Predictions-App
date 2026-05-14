import { motion } from 'framer-motion';

const OUTFIT_GROUPS = [
  {
    label: 'Casual',
    items: [
      { id: 'sweats',       icon: '👕', label: 'Sweatpants & Hoodie' },
      { id: 'jeans',        icon: '👖', label: 'Jeans & T-shirt' },
      { id: 'tshirt-shorts',icon: '🩳', label: 'T-Shirt & Shorts' },
      { id: 'loungewear',   icon: '🧸', label: 'Loungewear' },
      { id: 'sweater-pants',icon: '🧥', label: 'Sweater & Pants' },
    ],
  },
  {
    label: 'Active',
    items: [
      { id: 'athletic',    icon: '🏅', label: 'Athletic Wear' },
      { id: 'bathing-suit',icon: '👙', label: 'Bathing Suit / Bikini' },
      { id: 'swim-trunks', icon: '🩲', label: 'Swimming Trunks' },
    ],
  },
  {
    label: 'Going Out',
    items: [
      { id: 'going-out',  icon: '✨', label: 'Going-Out Outfit' },
      { id: 'cute-dress', icon: '👗', label: 'Cute Dress' },
      { id: 'shirt-skirt',icon: '🌸', label: 'Shirt & Skirt' },
      { id: 'creative',   icon: '🎨', label: 'Creative / Expressive' },
    ],
  },
  {
    label: 'Professional',
    items: [
      { id: 'business', icon: '👔', label: 'Business Casual' },
      { id: 'formal',   icon: '🎩', label: 'Formal / Dressed Up' },
      { id: 'uniform',  icon: '🎽', label: 'Uniform' },
    ],
  },
  {
    label: 'At Home',
    items: [
      { id: 'pajamas',  icon: '🛌', label: 'Pajamas' },
      { id: 'bathrobe', icon: '🩱', label: 'Bath Robe' },
    ],
  },
];

const COLOR = '#a78bfa';
const RGB   = '167,139,250';

export function AppearanceSelector({ selected, onChange }) {
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);

  return (
    <div style={{ padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {OUTFIT_GROUPS.map(group => (
        <div key={group.label}>
          {/* Group label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <div style={{ width: 2, height: 12, borderRadius: 1, background: `rgba(${RGB},0.5)`, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: `rgba(${RGB},0.6)`, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {group.label}
            </span>
          </div>

          {/* 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {group.items.map((outfit) => {
              const isOn = selected.includes(outfit.id);
              return (
                <motion.button
                  key={outfit.id}
                  onClick={() => toggle(outfit.id)}
                  whileHover={{ y: -1, boxShadow: isOn ? `0 4px 12px rgba(${RGB},0.22)` : '0 2px 8px rgba(0,0,0,0.3)' }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: isOn
                      ? `linear-gradient(135deg, rgba(${RGB},0.16), rgba(${RGB},0.07))`
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isOn ? `rgba(${RGB},0.4)` : 'rgba(255,255,255,0.08)'}`,
                    transition: 'background 0.15s, border 0.15s',
                  }}
                >
                  <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{outfit.icon}</span>
                  <span style={{
                    flex: 1, fontSize: 11, fontWeight: isOn ? 700 : 400,
                    color: isOn ? COLOR : '#94a3b8',
                    fontFamily: 'Space Grotesk', lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {outfit.label}
                  </span>
                  <div style={{
                    width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${isOn ? COLOR : 'rgba(255,255,255,0.18)'}`,
                    background: isOn ? COLOR : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isOn && <span style={{ fontSize: 8, color: '#000', fontWeight: 900, lineHeight: 1 }}>✓</span>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      {selected.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => onChange([])}
          style={{ alignSelf: 'flex-start', fontSize: 11, color: '#475569', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 0', fontFamily: 'DM Sans', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = '#94a3b8'}
          onMouseLeave={e => e.target.style.color = '#475569'}
        >
          Clear all selections
        </motion.button>
      )}
    </div>
  );
}
