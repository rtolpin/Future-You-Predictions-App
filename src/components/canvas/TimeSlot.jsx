import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { DroppedCardStack } from './DroppedCardStack.jsx';
import { getScoreColor } from '../../utils/scoreCalculator.js';

function scoreRgb(score) {
  if (score >= 7.5) return '0,212,177';
  if (score >= 5) return '245,158,11';
  return '248,113,113';
}

export function TimeSlot({ timeKey, label, cards = [], prediction, isLoading, onRemoveCard, onClick, isSelected }) {
  const { isOver, setNodeRef } = useDroppable({ id: `slot-${timeKey}` });

  const hasContent = cards.length > 0;
  const score = prediction?.scores?.overall;
  const isHour = !label.includes(':30');

  return (
    <motion.div
      ref={setNodeRef}
      onClick={() => hasContent && onClick?.()}
      className="relative flex items-center gap-0 transition-all group"
      animate={{
        background: isOver
          ? 'rgba(0,212,177,0.08)'
          : isSelected && hasContent
          ? 'rgba(0,212,177,0.06)'
          : 'transparent',
      }}
      style={{
        borderRadius: 10,
        minHeight: hasContent ? 'auto' : isHour ? 34 : 26,
        cursor: hasContent ? 'pointer' : 'default',
        border: isOver ? '1px solid rgba(0,212,177,0.3)' : isSelected && hasContent ? '1px solid rgba(0,212,177,0.2)' : '1px solid transparent',
      }}
      whileHover={hasContent ? { background: 'rgba(255,255,255,0.04)' } : {}}
    >
      {/* Time label */}
      <div className="w-14 shrink-0 flex items-center justify-end pr-3">
        <span
          className="font-mono text-right leading-none transition-colors"
          style={{
            fontSize: isHour ? 11 : 10,
            fontWeight: isHour ? 600 : 400,
            color: isHour ? '#475569' : '#2d3748',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {label}
        </span>
      </div>

      {/* Vertical ruler line */}
      <div className="w-px self-stretch shrink-0" style={{ background: isHour ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)' }} />

      {/* Drop zone / content */}
      <div className="flex-1 min-w-0 px-3 py-1">
        {!hasContent && !isOver && isHour && (
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-700 leading-none py-1"
            style={{ fontFamily: 'DM Sans', fontSize: 10 }}
          >
            drop a card here
          </div>
        )}
        {isOver && !hasContent && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            className="flex items-center gap-2 py-1"
          >
            <div className="flex-1 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #00d4b1, rgba(0,212,177,0.2))' }} />
            <span className="text-xs text-teal-400 shrink-0" style={{ fontSize: 10 }}>release</span>
          </motion.div>
        )}
        {hasContent && (
          <div className="py-0.5">
            <DroppedCardStack
              cards={cards}
              onRemove={(cardId) => onRemoveCard?.(timeKey, cardId)}
              hasPrediction={!!prediction}
            />
          </div>
        )}
      </div>

      {/* Right side: score badge or spinner */}
      <div className="w-12 shrink-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="spinner"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="w-4 h-4 rounded-full border-2 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{ borderColor: '#00d4b1', borderTopColor: 'transparent' }}
            />
          )}
          {!isLoading && score !== undefined && (
            <motion.div
              key="score"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg"
              style={{
                color: getScoreColor(score),
                background: `rgba(${scoreRgb(score)},0.15)`,
                border: `1px solid rgba(${scoreRgb(score)},0.25)`,
                fontSize: 10,
              }}
            >
              {score}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
