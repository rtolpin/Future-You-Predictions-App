import { motion } from 'framer-motion';

export function WeeklyReport({ weekData }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
        Weekly Report
      </h3>
      <p className="text-sm text-slate-400">Coming soon — simulate 7 days to unlock your weekly identity report.</p>
    </motion.div>
  );
}
