import { motion } from 'framer-motion';
import { getScoreColor } from '../../utils/scoreCalculator.js';

const FORECAST_HOURS = [
  { label: '1 hr', key: 'oneHour' },
  { label: '3 hrs', key: 'threeHours' },
  { label: 'Tonight', key: 'tonight' },
];

export function MoodForecast({ scores }) {
  if (!scores) return null;
  return (
    <div className="flex gap-3">
      {Object.entries(scores).filter(([k]) => k !== 'overall').map(([key, value], i) => (
        <motion.div
          key={key}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.08, type: 'spring' }}
          className="flex-1 rounded-lg p-2 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="text-lg font-bold font-mono" style={{ color: getScoreColor(value) }}>
            {value}
          </div>
          <div className="text-xs text-slate-500 capitalize mt-0.5">{key}</div>
        </motion.div>
      ))}
    </div>
  );
}
