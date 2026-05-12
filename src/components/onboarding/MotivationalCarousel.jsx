import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85&auto=format&fit=crop',
    category: 'Ambition',
    categoryIcon: '⛰️',
    quote: 'Every summit starts with a single step you chose to take.',
    accent: '#00d4b1',
  },
  {
    id: 2,
    photo: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=85&auto=format&fit=crop',
    category: 'Strength',
    categoryIcon: '💪',
    quote: 'The version of you that shows up tomorrow is built right now.',
    accent: '#f59e0b',
  },
  {
    id: 3,
    photo: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=85&auto=format&fit=crop',
    category: 'Purpose',
    categoryIcon: '🌆',
    quote: 'Your choices today are the architecture of your tomorrow.',
    accent: '#a78bfa',
  },
  {
    id: 4,
    photo: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&q=85&auto=format&fit=crop',
    category: 'Clarity',
    categoryIcon: '🌿',
    quote: 'Stillness is where your best self is waiting to be found.',
    accent: '#34d399',
  },
  {
    id: 5,
    photo: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=85&auto=format&fit=crop',
    category: 'Connection',
    categoryIcon: '🤝',
    quote: 'The best version of you always shows up for the people who matter.',
    accent: '#60a5fa',
  },
];

const INTERVAL = 10000;

export function MotivationalCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index, dir) => {
    setDirection(dir);
    setCurrent((index + SLIDES.length) % SLIDES.length);
  }, []);

  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => goTo(current + 1, 1), INTERVAL);
    return () => clearInterval(id);
  }, [current, paused, goTo]);

  const slide = SLIDES[current];

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Image layer ── */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={slide.id}
          custom={direction}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slide.photo}
            alt={slide.category}
            className="w-full h-full object-cover"
            draggable={false}
          />

          {/* Top gradient — for quote readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(9,9,15,0.25) 0%, rgba(9,9,15,0.35) 25%, rgba(9,9,15,0.6) 40%, rgba(9,9,15,0.6) 65%, rgba(9,9,15,0.35) 80%, rgba(9,9,15,0.55) 100%)',
            }}
          />

          {/* Right-edge fade to blend into CTA panel */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, transparent 65%, rgba(9,9,15,0.9) 100%)' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── CENTERED CONTENT — Quote & category ── */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center" style={{ paddingLeft: '48px', paddingRight: '40px', paddingBottom: '160px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`quote-${slide.id}`}
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            {/* Category pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-4"
              style={{
                background: `rgba(${hexToRgb(slide.accent)}, 0.22)`,
                border: `1px solid rgba(${hexToRgb(slide.accent)}, 0.5)`,
                color: slide.accent,
                fontFamily: 'Space Grotesk',
              }}
            >
              <span>{slide.categoryIcon}</span>
              <span>{slide.category}</span>
            </div>

            {/* Accent rule */}
            <motion.div
              className="mb-4 h-0.5 w-12 rounded-full"
              style={{ background: slide.accent, boxShadow: `0 0 8px ${slide.accent}` }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.55, delay: 0.3, ease: 'easeOut' }}
            />

            {/* Quote text */}
            <p
              className="text-white font-bold leading-snug"
              style={{
                fontFamily: 'Space Grotesk',
                fontSize: 'clamp(18px, 2.2vw, 26px)',
                textShadow: '0 2px 16px rgba(0,0,0,0.7)',
                maxWidth: '85%',
              }}
            >
              "{slide.quote}"
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── BOTTOM — Dots + arrows only ── */}
      <div className="absolute bottom-6 left-8 right-8 z-10 flex items-center justify-between">
        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className="rounded-full transition-all duration-500"
              style={{
                width: i === current ? 22 : 6,
                height: 6,
                background: i === current ? slide.accent : 'rgba(255,255,255,0.25)',
                boxShadow: i === current ? `0 0 10px ${slide.accent}` : 'none',
              }}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={prev}
            whileHover={{ scale: 1.12, background: 'rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <ChevronLeft size={14} color="white" />
          </motion.button>
          <motion.button
            onClick={next}
            whileHover={{ scale: 1.12, background: 'rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <ChevronRight size={14} color="white" />
          </motion.button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 z-20" style={{ background: 'rgba(255,255,255,0.07)' }}>
        {!paused && (
          <motion.div
            key={`bar-${slide.id}`}
            className="h-full rounded-full"
            style={{ background: slide.accent, boxShadow: `0 0 6px ${slide.accent}` }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: INTERVAL / 1000, ease: 'linear' }}
          />
        )}
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '255,255,255';
}
