import { motion } from 'framer-motion';

export function StreamingText({ text, className = '' }) {
  if (!text) return null;
  return (
    <motion.p
      className={`text-slate-300 text-sm leading-relaxed ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {text}
    </motion.p>
  );
}
