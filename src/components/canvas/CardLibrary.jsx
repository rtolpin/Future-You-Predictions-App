import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { decisionCards, CARD_CATEGORIES, CATEGORY_META } from '../../data/decisionCards.js';
import { DecisionCard } from './DecisionCard.jsx';

const CATEGORY_ORDER = [
  CARD_CATEGORIES.PERSONAL,
  CARD_CATEGORIES.CHORES,
  CARD_CATEGORIES.LOCATION,
  CARD_CATEGORIES.ACTIVITY,
  CARD_CATEGORIES.TRANSPORT,
  CARD_CATEGORIES.STUDY,
  CARD_CATEGORIES.FITNESS,
];

export function CardLibrary() {
  const [expanded, setExpanded] = useState({
    [CARD_CATEGORIES.LOCATION]: true,
    [CARD_CATEGORIES.ACTIVITY]: true,
    [CARD_CATEGORIES.PERSONAL]: true,
    [CARD_CATEGORIES.CHORES]: true,
    [CARD_CATEGORIES.TRANSPORT]: true,
    [CARD_CATEGORIES.STUDY]: true,
    [CARD_CATEGORIES.FITNESS]: true,
    [CARD_CATEGORIES.APPEARANCE]: true,
    [CARD_CATEGORIES.MOOD]: true,
  });

  const toggle = (cat) => setExpanded(e => ({ ...e, [cat]: !e[cat] }));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
        <h3 className="font-bold text-slate-200 uppercase tracking-widest" style={{ fontSize: 11, marginBottom: 4 }}>Card Library</h3>
        <p className="text-slate-600" style={{ fontSize: 12 }}>Drag cards onto the timeline</p>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto" style={{ paddingTop: 6, paddingBottom: 8 }}>
        {CATEGORY_ORDER.map(category => {
          const meta = CATEGORY_META[category];
          const cards = decisionCards.filter(c => c.category === category);
          const isOpen = expanded[category];

          return (
            <div key={category} style={{ marginBottom: 2 }}>
              {/* Category toggle */}
              <motion.button
                onClick={() => toggle(category)}
                whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                className="w-full flex items-center justify-between transition-all cursor-pointer"
                style={{ padding: '10px 20px' }}
              >
                <div className="flex items-center" style={{ gap: 10 }}>
                  <div className="w-2 h-2 rounded-full pulse-dot shrink-0" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
                  <span className="font-semibold" style={{ color: meta.color, fontSize: 12 }}>{meta.label}</span>
                  <span className="font-mono rounded" style={{ background: `rgba(${hexToRgb(meta.color)},0.12)`, color: meta.color, fontSize: 10, padding: '2px 6px' }}>
                    {cards.length}
                  </span>
                </div>
                <motion.span animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={13} color={meta.color} style={{ opacity: 0.7 }} />
                </motion.span>
              </motion.button>

              {/* Cards list */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div style={{ padding: '2px 10px 10px' }}>
                      {cards.map((card, i) => (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          style={{ marginBottom: 6 }}
                        >
                          <DecisionCard card={card} compact />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ margin: '0 16px', height: 1, background: 'rgba(255,255,255,0.04)' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}
