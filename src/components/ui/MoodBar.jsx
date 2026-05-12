import { motion } from 'framer-motion';
import { getScoreColor } from '../../utils/scoreCalculator.js';

export function MoodBar({ label, value = 0, max = 10 }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = getScoreColor(value);

  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs text-slate-400 w-24 shrink-0 font-mono">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
        />
      </div>
      <span className="text-xs font-mono w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}
