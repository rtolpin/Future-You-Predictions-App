import { motion, AnimatePresence } from 'framer-motion';

export function TransitionScreen({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100000,
            background: 'rgba(9,9,15,0.97)',
            backdropFilter: 'blur(16px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
          }}
        >
          {/* Spinning rings */}
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            {[0, 1].map(i => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute', inset: i * 12,
                  borderRadius: '50%',
                  border: '1.5px solid transparent',
                  borderTopColor: i === 0 ? 'rgba(0,212,177,0.8)' : 'rgba(167,139,250,0.7)',
                  borderRightColor: i === 0 ? 'rgba(0,212,177,0.2)' : 'rgba(167,139,250,0.2)',
                }}
                animate={{ rotate: i === 0 ? 360 : -360 }}
                transition={{ duration: i === 0 ? 0.9 : 1.4, repeat: Infinity, ease: 'linear' }}
              />
            ))}
            <div style={{
              position: 'absolute', inset: 22,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,212,177,0.3), rgba(167,139,250,0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>🔮</div>
          </div>

          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14,
              background: 'linear-gradient(135deg, #00d4b1, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Returning to Canvas…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
