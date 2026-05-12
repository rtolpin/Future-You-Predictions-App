import { motion } from 'framer-motion';

export function GlassCard({ children, className = '', glow, onClick, style = {} }) {
  return (
    <motion.div
      onClick={onClick}
      className={`rounded-xl border ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        borderColor: glow ? `rgba(${hexToRgb(glow)}, 0.3)` : 'rgba(255,255,255,0.08)',
        boxShadow: glow ? `0 0 20px rgba(${hexToRgb(glow)}, 0.1)` : 'none',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '255,255,255';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '255,255,255';
}
