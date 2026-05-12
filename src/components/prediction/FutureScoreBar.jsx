import { motion } from 'framer-motion';
import { getScoreColor, getScoreLabel } from '../../utils/scoreCalculator.js';

const SCORE_ITEMS = [
  { key: 'energy', label: 'Energy', icon: '🔋' },
  { key: 'mood', label: 'Mood', icon: '😊' },
  { key: 'productivity', label: 'Focus', icon: '🎯' },
  { key: 'social', label: 'Social', icon: '🤝' },
];

function hexToRgb(color) {
  if (color === '#00d4b1') return '0,212,177';
  if (color === '#f59e0b') return '245,158,11';
  return '248,113,113';
}

export function FutureScoreBar({ scores }) {
  if (!scores) return null;
  const overall = scores.overall ?? 5;
  const scoreColor = getScoreColor(overall);

  return (
    <div>
      {/* Mini score bars */}
      <div className="space-y-2 mb-3">
        {SCORE_ITEMS.map(({ key, label, icon }, i) => {
          const value = scores[key] ?? 5;
          const color = getScoreColor(value);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs shrink-0 w-4">{icon}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(value / 10) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 + i * 0.07 }}
                  style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
                />
              </div>
              <span className="text-xs font-mono font-bold shrink-0 w-4 text-right" style={{ color, fontSize: 10 }}>
                {value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Overall score — large display */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
        style={{
          background: `rgba(${hexToRgb(scoreColor)}, 0.12)`,
          border: `1px solid rgba(${hexToRgb(scoreColor)}, 0.25)`,
        }}
      >
        <div className="flex-1">
          <p className="text-xs text-slate-500 font-medium">Overall Score</p>
          <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(overall / 10) * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
              style={{ background: `linear-gradient(90deg, ${scoreColor}60, ${scoreColor})` }}
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <motion.p
            className="text-2xl font-black font-mono leading-none"
            style={{ color: scoreColor, fontFamily: 'JetBrains Mono, monospace' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.5 }}
          >
            {overall}
          </motion.p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: scoreColor, fontSize: 10 }}>
            {getScoreLabel(overall)}
          </p>
        </div>
      </div>
    </div>
  );
}
