import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { MotivationalCarousel } from './MotivationalCarousel.jsx';
import { defaultProfile } from '../../utils/profileBuilder.js';
import { CityAutocomplete } from '../ui/CityAutocomplete.jsx';

const STEPS = [
  { id: 'welcome' },
  {
    id: 'identity',
    step: 1,
    title: 'Who are you today?',
    subtitle: 'This shapes how I predict your social world.',
    fields: [
      { key: 'name', label: 'Your name (optional)', type: 'text', placeholder: 'What should I call you?' },
      {
        key: 'genderIdentity', label: 'Gender identity', type: 'chips',
        options: [
          { value: 'Man', icon: '♂' },
          { value: 'Woman', icon: '♀' },
          { value: 'Non-binary', icon: '⚧' },
          { value: 'Prefer not to say', icon: '·' },
        ],
      },
      {
        key: 'ageRange', label: 'Age range', type: 'chips',
        options: [
          { value: 'Teen (13-19)', icon: '🎒' },
          { value: '20s', icon: '✨' },
          { value: '30s', icon: '💫' },
          { value: '40s', icon: '🌟' },
          { value: '50s', icon: '🌅' },
          { value: '60s', icon: '🌄' },
          { value: '70+', icon: '🌇' },
        ],
      },
    ],
  },
  {
    id: 'situation',
    step: 2,
    title: 'Your current situation',
    subtitle: 'No judgment — context changes everything.',
    fields: [
      {
        key: 'employment', label: 'Employment status', type: 'chips',
        options: [
          { value: 'Employed full-time', icon: '💼' },
          { value: 'Part-time', icon: '⏱' },
          { value: 'Unemployed', icon: '🔍' },
          { value: 'Student', icon: '📚' },
          { value: 'Freelancer', icon: '💻' },
          { value: 'Retired', icon: '🌴' },
        ],
      },
      {
        key: 'relationshipStatus', label: 'Relationship (optional)', type: 'chips',
        options: [
          { value: 'Single', icon: '🔓' },
          { value: 'In a relationship', icon: '💑' },
          { value: 'Married', icon: '💍' },
          { value: 'Skip', icon: '···' },
        ],
      },
    ],
  },
  {
    id: 'today',
    step: 3,
    title: 'Right now, in this moment',
    subtitle: 'Your starting energy shapes the entire simulation.',
    fields: [
      { key: 'city', label: '📍 City / Neighborhood', type: 'city', placeholder: 'Start typing your city...' },
      { key: 'mood', label: '😊 Current mood', type: 'slider', min: 1, max: 10 },
      { key: 'energy', label: '⚡ Energy level', type: 'slider', min: 1, max: 10 },
    ],
  },
];

const MOOD_COLORS = ['#f87171','#fb923c','#fbbf24','#a3e635','#34d399','#22d3ee','#60a5fa','#818cf8','#c084fc','#e879f9'];
const STEP_TITLES = ['', 'Identity', 'Situation', 'Today'];

export function OnboardingForm({ onComplete }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState({
    name: '', genderIdentity: '', ageRange: '',
    employment: '', city: 'New York, New York', relationshipStatus: '',
    fitnessLevel: '', mood: 6, energy: 6,
  });

  const currentStep = STEPS[step];
  const handleChange = (key, value) => setProfile(p => ({ ...p, [key]: value }));
  const next = () => {
    if (step < STEPS.length - 1) { setDirection(1); setStep(s => s + 1); }
    else onComplete(profile);
  };
  const back = () => {
    if (step > 0) { setDirection(-1); setStep(s => s - 1); }
  };
  const skip = () => onComplete({ ...defaultProfile(), ...profile });

  const moodColor = MOOD_COLORS[(profile.mood || 6) - 1];
  const energyColor = MOOD_COLORS[(profile.energy || 6) - 1];

  // ── Welcome step: full-screen split layout ──
  if (step === 0) {
    return (
      <div className="h-screen flex overflow-hidden" style={{ background: '#09090f' }}>

        {/* LEFT — Motivational carousel (58%) — NO logo watermark here */}
        <motion.div
          className="relative overflow-hidden"
          style={{ flex: '0 0 58%' }}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <MotivationalCarousel />
        </motion.div>

        {/* RIGHT — CTA panel (42%) */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-10 py-12 relative overflow-hidden"
          style={{ background: '#09090f' }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,212,177,0.07) 0%, transparent 65%)' }} />
          {/* Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

            {/* Logo — lives here in the right panel */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2.5 mb-7"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, rgba(0,212,177,0.2), rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,177,0.3)' }}>
                🔮
              </div>
              <span className="font-bold text-white" style={{ fontFamily: 'Space Grotesk', fontSize: 17 }}>Future You</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(0,212,177,0.12)', color: '#00d4b1', border: '1px solid rgba(0,212,177,0.25)' }}>
                AI
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-center font-black leading-none mb-5"
              style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(34px, 4vw, 50px)' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <span className="text-white block">Meet your</span>
              <span className="gradient-text block">Future Self</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-center text-slate-400 leading-relaxed mb-7"
              style={{ fontSize: 14, lineHeight: 1.75 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              Build your day with drag-and-drop cards. Claude predicts{' '}
              <span className="text-slate-200">who'll be around you</span>,{' '}
              <span className="text-slate-200">how you'll feel</span>, and{' '}
              <span className="text-slate-200">who you're becoming</span>.
            </motion.p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48, width: '100%', maxWidth: 320 }}>
              {[
                { icon: '🎯', label: 'Drag & Drop Canvas', sub: 'Build your day visually', color: '#00d4b1', bg: 'rgba(0,212,177,0.1)', border: 'rgba(0,212,177,0.25)' },
                { icon: '🧠', label: 'AI Predictions',      sub: 'Powered by Claude',       color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
                { icon: '🌀', label: 'Parallel Lives',      sub: 'Compare timelines',       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
              ].map(({ icon, label, sub, color, bg, border }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.38 + i * 0.08 }}
                  whileHover={{ x: 4 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: bg,
                    border: `1px solid ${border}`,
                    width: '100%',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: `rgba(255,255,255,0.07)`,
                    border: `1px solid ${border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'Space Grotesk', lineHeight: 1.3 }}>{label}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2, lineHeight: 1.3 }}>{sub}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
                </motion.div>
              ))}
            </div>

            {/* ── CTA button — unmissable ── */}
            <motion.div
              className="w-full flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Pulsing rings behind the button */}
              <div className="relative w-full flex items-center justify-center">
                {/* Ring 1 */}
                <motion.div
                  className="absolute rounded-2xl pointer-events-none"
                  style={{ inset: -6, border: '2px solid rgba(0,212,177,0.35)', borderRadius: 22 }}
                  animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.15, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Ring 2 */}
                <motion.div
                  className="absolute rounded-2xl pointer-events-none"
                  style={{ inset: -14, border: '1.5px solid rgba(0,212,177,0.18)', borderRadius: 28 }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.05, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                />

                {/* The button itself */}
                <motion.button
                  onClick={next}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative w-full overflow-hidden flex items-center justify-between px-6 rounded-2xl text-black cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #00e8c6 0%, #00d4b1 60%, #00bfa3 100%)',
                    boxShadow: '0 0 32px rgba(0,212,177,0.5), 0 8px 24px rgba(0,212,177,0.3), inset 0 1px 0 rgba(255,255,255,0.35)',
                    height: 62,
                  }}
                >
                  {/* Shimmer */}
                  <motion.span
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)' }}
                    animate={{ x: ['-100%', '140%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
                  />

                  {/* Left: icon + text */}
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black/15 flex items-center justify-center shrink-0">
                      <Zap size={20} fill="currentColor" color="#000" />
                    </div>
                    <div className="text-left">
                      <p className="font-black leading-tight" style={{ fontFamily: 'Space Grotesk', fontSize: 16 }}>
                        Begin Simulation
                      </p>
                      <p className="font-medium opacity-70 leading-tight" style={{ fontSize: 11 }}>
                        Tap to get started →
                      </p>
                    </div>
                  </div>

                  {/* Right: arrow circle */}
                  <div className="relative z-10 w-9 h-9 rounded-xl bg-black/15 flex items-center justify-center shrink-0">
                    <ChevronRight size={20} color="#000" strokeWidth={2.5} />
                  </div>
                </motion.button>
              </div>

              <motion.button
                onClick={skip}
                whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(0,212,177,0.25)', borderColor: 'rgba(0,212,177,0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  padding: '10px 22px', borderRadius: 14,
                  background: 'rgba(0,212,177,0.08)',
                  border: '1.5px solid rgba(0,212,177,0.3)',
                  color: '#00d4b1', fontSize: 14, fontWeight: 700,
                  fontFamily: 'Space Grotesk',
                  boxShadow: '0 0 12px rgba(0,212,177,0.12)',
                  transition: 'all 0.2s',
                }}
              >
                ✨ Skip setup and explore now
                <ArrowRight size={15} />
              </motion.button>

              <p style={{ fontSize: 12, fontWeight: 600, color: '#34d399', fontFamily: 'Space Grotesk', letterSpacing: '0.01em' }}>
                No account needed · Free to explore
              </p>
            </motion.div>

          </div>
        </div>
      </div>
    );
  }

  // ── Form steps 1–3 — full-screen split layout ──
  const STEP_META = [
    null,
    { icon: '🧬', color: '#00d4b1', tagline: 'Your identity shapes your world', detail: 'The more I know about you, the more accurate your predictions become.' },
    { icon: '🌍', color: '#a78bfa', tagline: 'Context is everything', detail: 'Your circumstances are never a limitation — they\'re the raw material of your story.' },
    { icon: '⚡', color: '#f59e0b', tagline: 'You start from exactly where you are', detail: 'Your current energy is just the starting point. Let\'s see where today takes you.' },
  ];
  const meta = STEP_META[step];

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#09090f' }}>

      {/* ── LEFT PANEL — decorative context (38%) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`left-${step}`}
          className="flex-none flex flex-col justify-start gap-12 p-14 relative overflow-hidden"
          style={{ width: '38%', borderRight: '1px solid rgba(255,255,255,0.07)' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {/* Background radial glow keyed to step color */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 90% 70% at 20% 50%, ${meta.color}14 0%, transparent 65%)` }} />
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

          {/* Top: logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, rgba(0,212,177,0.2), rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,177,0.25)' }}>
              🔮
            </div>
            <span className="font-bold text-white" style={{ fontFamily: 'Space Grotesk', fontSize: 16 }}>Future You</span>
          </div>

          {/* Middle: large icon + message */}
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 18 }}
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-8"
              style={{
                background: `linear-gradient(135deg, ${meta.color}25, ${meta.color}08)`,
                border: `1px solid ${meta.color}35`,
                boxShadow: `0 0 40px ${meta.color}20`,
              }}
            >
              {meta.icon}
            </motion.div>

            <motion.div
              className="h-0.5 w-10 rounded-full mb-5"
              style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />

            <motion.h2
              className="font-black text-white leading-tight mb-4"
              style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(22px, 2.5vw, 30px)' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {meta.tagline}
            </motion.h2>

            <motion.p
              className="text-slate-500 leading-relaxed"
              style={{ fontSize: 14 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {meta.detail}
            </motion.p>
          </div>

          {/* Bottom: step progress pills */}
          <div className="relative z-10 flex flex-col gap-3">
            {STEPS.slice(1).map((s, i) => {
              const isDone = i + 1 < step;
              const isCurrent = i + 1 === step;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                    style={{
                      background: isDone ? '#00d4b1' : isCurrent ? meta.color : 'rgba(255,255,255,0.07)',
                      color: (isDone || isCurrent) ? '#000' : '#475569',
                      boxShadow: isCurrent ? `0 0 12px ${meta.color}80` : 'none',
                    }}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span
                    className="text-sm font-medium transition-all"
                    style={{ color: isCurrent ? meta.color : isDone ? '#64748b' : '#334155' }}
                  >
                    {STEP_TITLES[i + 1]}
                  </span>
                  {isCurrent && (
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${meta.color}50, transparent)` }} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── RIGHT PANEL — form (62%) ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#09090f' }}>
        {/* Top glow */}
        <div className="absolute pointer-events-none"
          style={{ top: 0, right: 0, width: '62%', height: '100%', background: `radial-gradient(ellipse 70% 50% at 70% 20%, ${meta.color}08 0%, transparent 55%)`, zIndex: 0 }} />

        {/* Scrollable form area */}
        <div className="relative z-10 flex-1 overflow-y-auto" style={{ padding: '44px 80px 16px 80px' }}>

          {/* Top bar: step label + skip */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
            style={{ marginBottom: 36 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full" style={{ background: `linear-gradient(180deg, ${meta.color}, ${meta.color}30)` }} />
              <span className="font-bold uppercase tracking-widest" style={{ color: meta.color, fontFamily: 'Space Grotesk', fontSize: 12 }}>
                Step {currentStep.step} of {STEPS.length - 1}
              </span>
            </div>
            <motion.button
              onClick={skip}
              whileHover={{ scale: 1.04, borderColor: 'rgba(0,212,177,0.45)', color: '#00d4b1', boxShadow: '0 0 14px rgba(0,212,177,0.2)' }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 cursor-pointer"
              style={{
                padding: '7px 16px', borderRadius: 10,
                background: 'rgba(0,212,177,0.07)',
                border: '1.5px solid rgba(0,212,177,0.25)',
                color: '#5eead4', fontSize: 13, fontWeight: 700,
                fontFamily: 'Space Grotesk', transition: 'all 0.15s',
              }}
            >
              Skip setup <ArrowRight size={13} />
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ x: direction > 0 ? 48 : -48, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction < 0 ? 48 : -48, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Heading */}
              <div style={{ marginBottom: 36 }}>
                <h2
                  className="font-black text-white leading-tight"
                  style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(28px, 3vw, 38px)', marginBottom: 10 }}
                >
                  {currentStep.title}
                </h2>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: 16, lineHeight: 1.65 }}>
                  {currentStep.subtitle}
                </p>
              </div>

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {currentStep.fields?.map(field => (
                  <div key={field.key}>
                    <label
                      className="block font-semibold text-slate-200"
                      style={{ fontSize: 15, letterSpacing: '0.01em', marginBottom: 12 }}
                    >
                      {field.label}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={profile[field.key]}
                        onChange={e => handleChange(field.key, e.target.value)}
                        className="w-full rounded-2xl text-white outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1.5px solid rgba(255,255,255,0.11)',
                          fontFamily: 'DM Sans',
                          fontSize: 15,
                          padding: '16px 22px',
                          maxWidth: 520,
                          lineHeight: 1.5,
                        }}
                        onFocus={e => { e.target.style.borderColor = `${meta.color}90`; e.target.style.boxShadow = `0 0 0 4px ${meta.color}18`; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.11)'; e.target.style.boxShadow = 'none'; }}
                      />
                    )}

                    {field.type === 'city' && (
                      <CityAutocomplete
                        value={profile[field.key]}
                        onChange={val => handleChange(field.key, val)}
                        accentColor={meta.color}
                        placeholder={field.placeholder}
                      />
                    )}

                    {field.type === 'chips' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {field.options.map(opt => {
                          const selected = profile[field.key] === opt.value;
                          return (
                            <motion.button
                              key={opt.value}
                              onClick={() => handleChange(field.key, opt.value)}
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              className="flex items-center rounded-xl font-semibold transition-all cursor-pointer"
                              style={{
                                gap: 10,
                                padding: '12px 22px',
                                fontSize: 14,
                                lineHeight: 1.4,
                                background: selected ? `${meta.color}20` : 'rgba(255,255,255,0.05)',
                                border: `1.5px solid ${selected ? meta.color : 'rgba(255,255,255,0.1)'}`,
                                color: selected ? meta.color : '#94a3b8',
                                boxShadow: selected ? `0 0 16px ${meta.color}30` : 'none',
                              }}
                            >
                              <span style={{ fontSize: 18, lineHeight: 1 }}>{opt.icon}</span>
                              {opt.value}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {field.type === 'slider' && (
                      <div style={{ maxWidth: 520 }}>
                        <input
                          type="range" min={field.min} max={field.max}
                          value={profile[field.key]}
                          onChange={e => handleChange(field.key, Number(e.target.value))}
                          className="w-full"
                          style={{ marginBottom: 16 }}
                        />
                        <div className="flex justify-between items-center">
                          <span style={{ color: '#475569', fontSize: 13 }}>Low</span>
                          <div className="flex items-baseline gap-2">
                            <span
                              className="font-black font-mono"
                              style={{ fontSize: 34, color: field.key === 'mood' ? moodColor : energyColor, fontFamily: 'JetBrains Mono, monospace' }}
                            >
                              {profile[field.key]}
                            </span>
                            <span style={{ color: '#475569', fontSize: 14 }}>/ 10</span>
                          </div>
                          <span style={{ color: '#475569', fontSize: 13 }}>High</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Nav row */}
              <div
                className="flex items-center justify-between"
                style={{
                  marginTop: 40,
                  paddingTop: 24,
                  paddingBottom: 40,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <motion.button
                  onClick={back}
                  whileHover={{ x: -3, color: '#e2e8f0' }}
                  className="flex items-center text-slate-500 transition-all cursor-pointer"
                  style={{ fontSize: 15, fontFamily: 'DM Sans', gap: 8, padding: '10px 6px' }}
                >
                  <ChevronLeft size={18} /> Back
                </motion.button>

                <motion.button
                  onClick={next}
                  whileHover={{ scale: 1.03, boxShadow: `0 0 36px ${meta.color}55` }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center rounded-2xl font-bold text-black cursor-pointer"
                  style={{
                    gap: 10,
                    background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                    boxShadow: `0 0 22px ${meta.color}38`,
                    padding: '15px 36px',
                    fontSize: 15,
                    fontFamily: 'Space Grotesk',
                    letterSpacing: '0.02em',
                  }}
                >
                  {step === STEPS.length - 1
                    ? <><Sparkles size={17} /> Launch Simulation</>
                    : <>Continue <ChevronRight size={17} /></>
                  }
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
