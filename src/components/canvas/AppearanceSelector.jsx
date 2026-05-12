import { motion } from 'framer-motion';

const OUTFITS = [
  { id: 'sweats',     icon: '👕', label: 'Sweatpants & Hoodie' },
  { id: 'jeans',      icon: '👖', label: 'Jeans & T-shirt' },
  { id: 'athletic',   icon: '🏅', label: 'Athletic Wear' },
  { id: 'business',   icon: '👔', label: 'Business Casual' },
  { id: 'formal',     icon: '🎩', label: 'Formal / Dressed Up' },
  { id: 'creative',   icon: '🎨', label: 'Creative / Expressive' },
  { id: 'loungewear', icon: '🧸', label: 'Loungewear' },
  { id: 'going-out',  icon: '✨', label: 'Going-Out Outfit' },
  { id: 'cute-dress',   icon: '👗', label: 'Cute Dress' },
  { id: 'shirt-skirt',  icon: '🌸', label: 'Shirt & Skirt' },
  { id: 'uniform',      icon: '🎽', label: 'Uniform' },
  { id: 'pajamas',      icon: '🛌', label: 'Pajamas' },
  { id: 'bathrobe',     icon: '🩱', label: 'Bath Robe' },
  { id: 'sweater-pants',icon: '🧥', label: 'Sweater & Pants' },
  { id: 'tshirt-shorts',icon: '🩳', label: 'T-Shirt & Shorts' },
  { id: 'bathing-suit', icon: '👙', label: 'Bathing Suit / Bikini' },
  { id: 'swim-trunks',  icon: '🩲', label: 'Swimming Trunks' },
];

const COLOR = '#a78bfa';
const RGB   = '167,139,250';

export function AppearanceSelector({ selected, onChange }) {
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);

  return (
    <div
      className="shrink-0 flex items-start"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.2)',
        padding: '10px 16px',
        gap: 12,
      }}
    >
      {/* Label pill */}
      <div
        className="shrink-0 flex flex-col items-center text-center"
        style={{
          gap: 5, padding: '8px 10px', borderRadius: 12, minWidth: 74,
          background: `rgba(${RGB},0.1)`,
          border: `1px solid rgba(${RGB},0.25)`,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>👗</span>
        <p style={{ fontSize: 10, fontWeight: 800, color: COLOR, fontFamily: 'Space Grotesk', letterSpacing: '0.04em', lineHeight: 1.2 }}>
          Today's Look
        </p>
        <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.3, fontFamily: 'DM Sans' }}>
          All planned outfits
        </p>
        {selected.length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onChange([])}
            style={{ fontSize: 9, color: '#475569', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: 'DM Sans', marginTop: 1 }}
            onMouseEnter={e => e.target.style.color = '#94a3b8'}
            onMouseLeave={e => e.target.style.color = '#475569'}
          >
            Clear
          </motion.button>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Aligned chip list */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          flex: 1,
          alignContent: 'flex-start',
        }}
      >
        {OUTFITS.map((outfit, i) => {
          const isOn = selected.includes(outfit.id);
          return (
            <>
              {outfit.id === 'pajamas' && (
                <div key="break-pajamas" style={{ width: '100%', height: 0 }} />
              )}
            <motion.button
              key={outfit.id}
              onClick={() => toggle(outfit.id)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center cursor-pointer transition-all"
              style={{
                gap: 6,
                padding: '5px 10px 5px 8px',
                borderRadius: 20,
                background: isOn ? `rgba(${RGB},0.2)` : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isOn ? COLOR : 'rgba(255,255,255,0.09)'}`,
                boxShadow: isOn ? `0 0 10px rgba(${RGB},0.25)` : 'none',
              }}
            >
              {/* Mini checkbox */}
              <div style={{
                width: 13, height: 13, borderRadius: 3, flexShrink: 0,
                border: `1.5px solid ${isOn ? COLOR : 'rgba(255,255,255,0.2)'}`,
                background: isOn ? COLOR : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isOn && <span style={{ fontSize: 7, color: '#000', fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </div>

              <span style={{ fontSize: 14, lineHeight: 1 }}>{outfit.icon}</span>

              <span style={{
                fontSize: 12,
                fontWeight: isOn ? 700 : 500,
                color: isOn ? COLOR : '#94a3b8',
                fontFamily: 'Space Grotesk',
              }}>
                {outfit.label}
              </span>
            </motion.button>
            </>
          );
        })}
      </div>
    </div>
  );
}
