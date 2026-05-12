import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CATEGORY_META } from '../../data/decisionCards.js';

function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}

export function DroppedCardStack({ cards, onRemove }) {
  if (!cards?.length) return null;
  const visible = cards.slice(0, 3);
  const extra = cards.length - 3;

  return (
    <div className="flex flex-wrap gap-1.5">
      <AnimatePresence>
        {visible.map((card) => {
          const meta = CATEGORY_META[card.category];
          const rgb = hexToRgb(meta.color);
          return (
            <motion.div
              key={card.id}
              initial={{ scale: 0.7, opacity: 0, y: -4 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: -4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg group relative"
              style={{
                background: `linear-gradient(135deg, rgba(${rgb},0.18), rgba(${rgb},0.08))`,
                border: `1px solid rgba(${rgb},0.3)`,
                boxShadow: `0 2px 8px rgba(${rgb},0.1)`,
              }}
            >
              <span className="text-sm leading-none">{card.icon}</span>
              <span className="text-xs font-semibold max-w-[100px] truncate" style={{ color: meta.color }}>
                {card.label}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove?.(card.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity -mr-0.5 ml-0.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <X size={10} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {extra > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xs text-slate-500 px-2 py-1.5 rounded-lg font-medium"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          +{extra} more
        </motion.span>
      )}
    </div>
  );
}
