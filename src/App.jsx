import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GitBranch, Layers, LayoutDashboard, Sparkles, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Settings2, Minimize2, X, Save, CalendarDays, LogOut, UserCircle, Menu, Zap, Target, ClipboardList, Check, GripVertical } from 'lucide-react';
import { useIsMobile } from './hooks/useIsMobile.js';

import { OnboardingForm } from './components/onboarding/OnboardingForm.jsx';
import { DayCanvas } from './components/canvas/DayCanvas.jsx';
import { ParallelDaysView } from './components/canvas/ParallelDaysView.jsx';
import { PredictionPanel } from './components/prediction/PredictionPanel.jsx';
import { DayPredictionFullscreen } from './components/prediction/DayPredictionFullscreen.jsx';
import { DayComparisonFullscreen } from './components/prediction/DayComparisonFullscreen.jsx';
import { AppearanceSelector } from './components/canvas/AppearanceSelector.jsx';
import { BranchTreeView } from './components/tree/BranchTreeView.jsx';
import { IdentityPanel } from './components/profile/IdentityPanel.jsx';
import { ProfileAvatar } from './components/profile/ProfileAvatar.jsx';
import { DailySummary } from './components/summary/DailySummary.jsx';
import { AuthModal } from './components/account/AuthModal.jsx';
import { HistoryCalendar } from './components/account/HistoryCalendar.jsx';
import { DayGoals } from './components/goals/DayGoals.jsx';
import { DayRetrospective } from './components/goals/DayRetrospective.jsx';
import { useTimeline, minutesToLabel } from './hooks/useTimeline.js';
import { simulateDecision, simulateDayFlow } from './utils/claudeClient.js';
import { authClient, daysClient } from './utils/accountClient.js';
import { SimulationLoadingScreen } from './components/simulation/SimulationLoadingScreen.jsx';

const VIEWS = {
  SINGLE: 'single',
  PARALLEL: 'parallel',
  TREE: 'tree',
};

const VIEW_CONFIG = [
  {
    id: VIEWS.SINGLE,
    icon: <LayoutDashboard size={15} />,
    label: 'Day Canvas',
    shortLabel: 'Canvas',
    description: 'Build your day',
    color: '#00d4b1',
    colorRgb: '0,212,177',
  },
  {
    id: VIEWS.PARALLEL,
    icon: <Layers size={15} />,
    label: 'Parallel Days',
    shortLabel: 'Parallel',
    description: 'Compare 2 life paths',
    color: '#a78bfa',
    colorRgb: '167,139,250',
  },
  {
    id: VIEWS.TREE,
    icon: <GitBranch size={15} />,
    label: 'Decision Tree',
    shortLabel: 'Tree',
    description: 'Map every choice',
    color: '#f59e0b',
    colorRgb: '245,158,11',
  },
];

function RightPanelGoals({ goals, checkedGoals, onToggle, onOpenGoalsModal }) {
  const [buildOpen, setBuildOpen] = useState(true);
  const [breakOpen, setBreakOpen] = useState(true);

  const buildGoals = goals.filter(g => g.type === 'build');
  const breakGoals = goals.filter(g => g.type === 'break');
  const doneCount  = goals.filter(g => checkedGoals.has(g.id)).length;
  const pct        = Math.round((doneCount / goals.length) * 100);
  const allDone    = doneCount === goals.length;

  if (goals.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
        <p style={{ color: '#475569', fontSize: 13, fontFamily: 'DM Sans', lineHeight: 1.6, marginBottom: 16 }}>
          No goals set for today.
        </p>
        <motion.button onClick={onOpenGoalsModal}
          whileHover={{ scale: 1.04, boxShadow: '0 0 18px rgba(0,212,177,0.3)' }} whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid rgba(0,212,177,0.4)', background: 'rgba(0,212,177,0.1)', color: '#00d4b1', fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk', cursor: 'pointer' }}>
          <Target size={13} /> Set Goals
        </motion.button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* Progress header */}
      <div style={{ padding: '14px 16px 10px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{allDone ? '🏆' : '🎯'}</span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: allDone ? '#34d399' : '#94a3b8', fontFamily: 'Space Grotesk' }}>
            {allDone ? '✨ All done today!' : `${doneCount} of ${goals.length} complete`}
          </span>
          <motion.button onClick={onOpenGoalsModal} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
            title="Edit goals"
            style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Target size={11} />
          </motion.button>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 2, background: allDone ? 'linear-gradient(90deg,#34d399,#00d4b1)' : '#00d4b1', boxShadow: '0 0 6px rgba(0,212,177,0.5)' }} />
        </div>
      </div>

      {/* Goal sections */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '10px 10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {buildGoals.length > 0 && (
          <div style={{ borderRadius: 10, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.04)' }}>
            <button onClick={() => setBuildOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: buildOpen ? '1px solid rgba(52,211,153,0.15)' : 'none' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 5px #34d399', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 10, fontWeight: 800, color: '#34d399', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>✅ Good Habits</span>
              <span style={{ fontSize: 10, color: '#34d399', opacity: 0.7, fontFamily: 'Space Grotesk' }}>{buildGoals.filter(g => checkedGoals.has(g.id)).length}/{buildGoals.length}</span>
              <motion.span animate={{ rotate: buildOpen ? 0 : -90 }} transition={{ duration: 0.15 }} style={{ display: 'flex', color: '#34d399', opacity: 0.5 }}><ChevronDown size={11} /></motion.span>
            </button>
            <div style={{ maxHeight: buildOpen ? 2000 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
              <div style={{ padding: '5px 8px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {buildGoals.map(g => <GoalRow key={g.id} g={g} checked={checkedGoals.has(g.id)} onToggle={onToggle} />)}
              </div>
            </div>
          </div>
        )}

        {breakGoals.length > 0 && (
          <div style={{ borderRadius: 10, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.04)' }}>
            <button onClick={() => setBreakOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: breakOpen ? '1px solid rgba(248,113,113,0.15)' : 'none' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 5px #f87171', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 10, fontWeight: 800, color: '#f87171', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>🚫 Bad Habits</span>
              <span style={{ fontSize: 10, color: '#f87171', opacity: 0.7, fontFamily: 'Space Grotesk' }}>{breakGoals.filter(g => checkedGoals.has(g.id)).length}/{breakGoals.length}</span>
              <motion.span animate={{ rotate: breakOpen ? 0 : -90 }} transition={{ duration: 0.15 }} style={{ display: 'flex', color: '#f87171', opacity: 0.5 }}><ChevronDown size={11} /></motion.span>
            </button>
            <div style={{ maxHeight: breakOpen ? 2000 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
              <div style={{ padding: '5px 8px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {breakGoals.map(g => <GoalRow key={g.id} g={g} checked={checkedGoals.has(g.id)} onToggle={onToggle} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalRow({ g, checked, onToggle }) {
  const isBuild  = g.type === 'build';
  const col      = isBuild ? '#34d399' : '#f87171';
  const rgb      = isBuild ? '52,211,153' : '248,113,113';
  const textCol  = isBuild ? '#6ee7b7' : '#fca5a5';
  return (
    <motion.button
      onClick={() => onToggle(g.id)}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        background: checked ? `rgba(${rgb},0.1)` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${checked ? `rgba(${rgb},0.35)` : 'rgba(255,255,255,0.06)'}`,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{g.emoji}</span>
      <span style={{
        flex: 1, fontSize: 12, fontWeight: 500, fontFamily: 'DM Sans',
        color: checked ? textCol : '#cbd5e1',
        textDecoration: checked ? 'line-through' : 'none',
        textDecorationColor: `rgba(${rgb},0.5)`,
      }}>{g.text}</span>
      <motion.div
        animate={{ scale: checked ? [1.25, 1] : 1 }}
        style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${checked ? col : 'rgba(255,255,255,0.15)'}`,
          background: checked ? `rgba(${rgb},0.22)` : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border 0.15s, background 0.15s',
        }}
      >
        <AnimatePresence>
          {checked && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.12 }}>
              <Check size={11} color={col} strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}

function GoalsPanel({ goals, checkedGoals, onToggle, headerHeight }) {
  const [open, setOpen]           = useState(true);
  const [buildOpen, setBuildOpen] = useState(true);
  const [breakOpen, setBreakOpen] = useState(true);

  const buildGoals = goals.filter(g => g.type === 'build');
  const breakGoals = goals.filter(g => g.type === 'break');
  const doneCount  = goals.filter(g => checkedGoals.has(g.id)).length;
  const pct        = Math.round((doneCount / goals.length) * 100);
  const allDone    = doneCount === goals.length;

  return (
    <motion.div
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      exit={{ x: -260 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        position: 'fixed',
        left: 0,
        top: headerHeight ?? 62,
        bottom: 0,
        width: 248,
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(13,13,24,0.97) 0%, rgba(9,9,15,0.97) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.09)',
        backdropFilter: 'blur(16px)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── Panel header ── */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: allDone ? 'rgba(52,211,153,0.18)' : 'rgba(0,212,177,0.12)', border: `1.5px solid ${allDone ? 'rgba(52,211,153,0.45)' : 'rgba(0,212,177,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
            {allDone ? '🏆' : '🎯'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>Today's Goals</p>
            <p style={{ fontSize: 11, color: allDone ? '#34d399' : '#64748b', fontFamily: 'DM Sans', marginTop: 1 }}>
              {allDone ? '✨ All done!' : `${doneCount} of ${goals.length} complete`}
            </p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Space Grotesk', color: allDone ? '#34d399' : '#94a3b8', background: allDone ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${allDone ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
            {doneCount}/{goals.length}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 2, background: allDone ? 'linear-gradient(90deg,#34d399,#00d4b1)' : '#00d4b1', boxShadow: '0 0 6px rgba(0,212,177,0.5)' }}
          />
        </div>
      </div>

      {/* ── Scrollable goal sections ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '10px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* ✅ Good Habits to Build */}
        {buildGoals.length > 0 && (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.04)' }}>
            <button
              onClick={() => setBuildOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: buildOpen ? '1px solid rgba(52,211,153,0.15)' : 'none' }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, fontWeight: 800, color: '#34d399', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>
                ✅ Good Habits
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', opacity: 0.7, fontFamily: 'Space Grotesk' }}>
                {buildGoals.filter(g => checkedGoals.has(g.id)).length}/{buildGoals.length}
              </span>
              <motion.span animate={{ rotate: buildOpen ? 0 : -90 }} transition={{ duration: 0.18 }} style={{ display: 'flex', color: '#34d399', opacity: 0.5 }}>
                <ChevronDown size={12} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {buildOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '6px 8px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {buildGoals.map(g => <GoalRow key={g.id} g={g} checked={checkedGoals.has(g.id)} onToggle={onToggle} />)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 🚫 Bad Habits to Break */}
        {breakGoals.length > 0 && (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.04)' }}>
            <button
              onClick={() => setBreakOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: breakOpen ? '1px solid rgba(248,113,113,0.15)' : 'none' }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 6px #f87171', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, fontWeight: 800, color: '#f87171', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left' }}>
                🚫 Bad Habits
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', opacity: 0.7, fontFamily: 'Space Grotesk' }}>
                {breakGoals.filter(g => checkedGoals.has(g.id)).length}/{breakGoals.length}
              </span>
              <motion.span animate={{ rotate: breakOpen ? 0 : -90 }} transition={{ duration: 0.18 }} style={{ display: 'flex', color: '#f87171', opacity: 0.5 }}>
                <ChevronDown size={12} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {breakOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '6px 8px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {breakGoals.map(g => <GoalRow key={g.id} g={g} checked={checkedGoals.has(g.id)} onToggle={onToggle} />)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('future-you-profile')) || null; } catch { return null; }
  });
  const [view, setView] = useState(VIEWS.SINGLE);
  const [showMobilePrediction, setShowMobilePrediction] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedOutfits, setSelectedOutfits] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [predictionWidth, setPredictionWidth] = useState(320);
  const [predictionFullscreen, setPredictionFullscreen] = useState(false);
  const [predictionOpen, setPredictionOpen] = useState(true);
  const [dayPrediction, setDayPrediction] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [parallelFullscreen, setParallelFullscreen] = useState(null); // { type: 'single'|'compare', data, meta }

  const [account, setAccount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('future-you-account')) || null; } catch { return null; }
  });
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [checkedGoals, setCheckedGoals] = useState(() => {
    try {
      const acct = JSON.parse(localStorage.getItem('future-you-account'));
      if (!acct) return new Set();
      return new Set(JSON.parse(localStorage.getItem('future-you-checked-goals')) || []);
    } catch { return new Set(); }
  });

  const toggleCheckedGoal = useCallback((id) => {
    setCheckedGoals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      const acct = JSON.parse(localStorage.getItem('future-you-account') || 'null');
      if (acct) localStorage.setItem('future-you-checked-goals', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const [rightPanelTab, setRightPanelTab] = useState('predictions'); // 'predictions' | 'goals'

  const [goals, setGoals] = useState(() => {
    try {
      const acct = JSON.parse(localStorage.getItem('future-you-account'));
      if (!acct) return [];
      return JSON.parse(localStorage.getItem('future-you-goals')) || [];
    } catch { return []; }
  });
  const [showGoals, setShowGoals] = useState(false);
  const [showRetrospective, setShowRetrospective] = useState(false);
  const [retroResult, setRetroResult]             = useState(null);
  const [summaryResult, setSummaryResult]         = useState(null);

  const handleGoalsChange = useCallback((updated) => {
    if (account) localStorage.setItem('future-you-goals', JSON.stringify(updated));
    setGoals(updated);
  }, [account]);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving'|'saved'|'error'
  const [simProgress, setSimProgress] = useState({ active: false, current: 0, total: 0, currentAction: '' });

  const timeline = useTimeline();

  const handleAccountLogin = useCallback((user) => {
    localStorage.setItem('future-you-account', JSON.stringify(user));
    setAccount(user);
    setShowAuth(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('future-you-token');
    localStorage.removeItem('future-you-account');
    localStorage.removeItem('future-you-goals');
    localStorage.removeItem('future-you-checked-goals');
    setAccount(null);
    setGoals([]);
    setCheckedGoals(new Set());
  }, []);

  const handleSaveDay = useCallback(async () => {
    if (!account) { setShowAuth(true); return; }
    if (timeline.events.length === 0) return;
    setSaveStatus('saving');
    try {
      const today = new Date().toISOString().split('T')[0];
      await daysClient.save({
        title: profile?.name ? `${profile.name}'s Day` : `My Day — ${today}`,
        date: today,
        events: timeline.events,
        predictions: timeline.predictions,
        mood: selectedMood,
        outfits: selectedOutfits,
        profile,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 2500);
    }
  }, [account, timeline, profile, selectedMood, selectedOutfits]);

  // ── Auto-save when signed in and events change (debounced 3s) ──
  const autoSaveTimer = useRef(null);
  const eventCount = timeline.events.length;
  useEffect(() => {
    if (!account || eventCount === 0) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        await daysClient.save({
          title: profile?.name ? `${profile.name}'s Day` : `My Day — ${today}`,
          date: today,
          events: timeline.events,
          predictions: timeline.predictions,
          mood: selectedMood,
          outfits: selectedOutfits,
          profile,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      } catch { /* silent */ }
    }, 3000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [account, eventCount]); // eslint-disable-line react-hooks/exhaustive-deps


  const handlePredictionResizeStart = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = predictionWidth;
    const onMove = (moveEvt) => {
      const delta = startX - moveEvt.clientX;
      setPredictionWidth(Math.min(700, Math.max(260, startWidth + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [predictionWidth]);

  const handleProfileComplete = useCallback((p) => {
    localStorage.setItem('future-you-profile', JSON.stringify(p));
    setProfile(p);
  }, []);

  const handleProfileUpdate = useCallback((p) => {
    localStorage.setItem('future-you-profile', JSON.stringify(p));
    setProfile(p);
  }, []);

  const handleSimulate = useCallback(async ({ eventId, timeKey, label, action, appearance, previousChoices }) => {
    const key = eventId || timeKey;
    timeline.setLoading(key, true);
    try {
      const outfitDescription = selectedOutfits.length > 0
        ? selectedOutfits.join(', ')
        : appearance || profile?.appearance;
      const result = await simulateDecision({
        action,
        timeSlot: label,
        profile: { ...profile, startingMood: selectedMood || profile?.mood },
        previousChoices,
        appearance: outfitDescription,
      });
      timeline.setPrediction(key, result);
      setSelectedEventId(key);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      timeline.setLoading(key, false);
    }
  }, [timeline, profile]);

  const handleSimulateAll = useCallback(async () => {
    const events = timeline.events;
    if (!events || events.length === 0) return;
    const sorted = [...events].sort((a, b) => a.startMinutes - b.startMinutes);
    const eventPayload = sorted.map(e => ({
      label: e.card.label,
      time: minutesToLabel(e.startMinutes),
      duration: e.durationMinutes,
    }));
    setSimProgress({ active: true, current: 1, total: 1, currentAction: 'your full day' });
    try {
      const result = await simulateDayFlow({
        events: eventPayload,
        profile,
        mood: selectedMood,
        outfits: selectedOutfits,
      });
      setDayPrediction(result);
      setPredictionFullscreen(true);
      setPredictionOpen(true);
    } catch (err) {
      console.error('SimulateAll error:', err);
    } finally {
      setSimProgress({ active: false, current: 0, total: 0, currentAction: '' });
    }
  }, [timeline.events, profile, selectedMood, selectedOutfits]);

  const handleSelectEvent = useCallback((eventId) => {
    setSelectedEventId(eventId);
  }, []);

  const handleNodeClick = useCallback(({ timeKey }) => {
    setSelectedEventId(timeKey);
  }, []);

  const activePrediction = selectedEventId ? timeline.predictions[selectedEventId] : null;
  const isLoadingSlot = selectedEventId ? timeline.loading[selectedEventId] : false;
  const hasChoices = timeline.getAllChoices().length > 0;
  const filledSlotCount = timeline.events.length;

  if (!profile) return <OnboardingForm onComplete={handleProfileComplete} />;

  return (
    <>
    <SimulationLoadingScreen
      active={simProgress.active}
      current={simProgress.current}
      total={simProgress.total}
      currentAction={simProgress.currentAction}
    />
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#09090f' }}>
      {/* Background ambiance */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0,212,177,0.07) 0%, transparent 55%)' }} className="absolute inset-0" />
        <div style={{ background: 'radial-gradient(ellipse 60% 40% at 85% 80%, rgba(167,139,250,0.05) 0%, transparent 50%)' }} className="absolute inset-0" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-20 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between" style={{ padding: isMobile ? '10px 14px' : '14px 24px', background: 'rgba(9,9,15,0.85)', backdropFilter: 'blur(20px)', gap: isMobile ? 8 : 16 }}>

          {/* Logo */}
          <motion.button
            onClick={() => {
              if (account) return; // signed-in users: never wipe identity
              localStorage.removeItem('future-you-profile');
              setProfile(null);
            }}
            className="flex items-center cursor-pointer shrink-0"
            style={{ gap: isMobile ? 8 : 12 }}
            whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.96 }}
            title={account ? 'Future You' : 'Return to setup'}
          >
            <motion.div
              className="rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ width: isMobile ? 34 : 36, height: isMobile ? 34 : 36, background: 'linear-gradient(135deg, rgba(0,212,177,0.2), rgba(167,139,250,0.2))', border: '1px solid rgba(0,212,177,0.25)' }}
              animate={{ boxShadow: ['0 0 12px rgba(0,212,177,0.2)', '0 0 20px rgba(0,212,177,0.35)', '0 0 12px rgba(0,212,177,0.2)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >🔮</motion.div>
            <div className="text-left">
              <h1 style={{
                fontFamily: 'Space Grotesk', fontWeight: 900,
                fontSize: isMobile ? 17 : 22,
                lineHeight: 1.15,
                background: 'linear-gradient(135deg, #00d4b1 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '-0.2px',
              }}>Future You</h1>
              {!isMobile && <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontFamily: 'DM Sans', letterSpacing: '0.04em', marginTop: 2 }}>AI Life Simulator</p>}
            </div>
          </motion.button>

          {/* View tabs — desktop only; mobile uses bottom nav */}
          {!isMobile && (
            <div className="flex items-center gap-1 shrink-0">
              {VIEW_CONFIG.map(({ id, icon, label, color, colorRgb }) => {
                const active = view === id;
                const isExplore = id !== VIEWS.SINGLE;
                return (
                  <motion.button
                    key={id}
                    onClick={() => setView(id)}
                    whileHover={!active ? { color } : {}}
                    whileTap={{ scale: 0.96 }}
                    className="relative flex items-center cursor-pointer"
                    style={{
                      gap: 8, padding: '11px 20px', borderRadius: 12,
                      border: isExplore && !active ? `1px solid rgba(${colorRgb},0.22)` : '1px solid transparent',
                      background: isExplore && !active ? `rgba(${colorRgb},0.06)` : 'transparent',
                      color: active ? color : isExplore ? color : '#94a3b8',
                      fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 800,
                    }}
                  >
                    {active && (
                      <motion.div
                        layoutId="view-tab-indicator"
                        className="absolute inset-0"
                        style={{
                          borderRadius: 11,
                          background: `linear-gradient(135deg, rgba(${colorRgb},0.22), rgba(${colorRgb},0.09))`,
                          border: `1.5px solid rgba(${colorRgb},0.45)`,
                          boxShadow: `0 0 18px rgba(${colorRgb},0.22)`,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.7 }}
                      />
                    )}
                    <span style={{ opacity: active ? 1 : 0.8, position: 'relative', zIndex: 1 }}>{icon}</span>
                    <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
                    {isExplore && !active && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, fontFamily: 'Space Grotesk',
                        background: `rgba(${colorRgb},0.2)`, border: `1px solid rgba(${colorRgb},0.4)`,
                        color, borderRadius: 20, padding: '2px 6px',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        position: 'relative', zIndex: 1,
                      }}>✨ Explore</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center shrink-0" style={{ gap: isMobile ? 8 : 12 }}>

            {/* ── Action group: Goals + Retro + Summary + Save — hidden on mobile ── */}
            {!isMobile && <div
              className="flex items-center gap-2"
            >
              {/* Day Goals */}
              <motion.button
                onClick={() => setShowGoals(true)}
                whileHover={{ scale: 1.03, boxShadow: '0 0 14px rgba(0,212,177,0.3)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl font-bold transition-all cursor-pointer"
                style={{
                  padding: '7px 18px', fontSize: 14,
                  background: goals.length > 0 ? 'linear-gradient(135deg, rgba(0,212,177,0.22), rgba(0,212,177,0.1))' : 'rgba(0,212,177,0.1)',
                  color: '#00d4b1',
                  border: `1px solid ${goals.length > 0 ? 'rgba(0,212,177,0.45)' : 'rgba(0,212,177,0.25)'}`,
                  fontFamily: 'Space Grotesk',
                }}
              >
                <Target size={15} />
                Goals{goals.length > 0 ? ` (${goals.length})` : ''}
              </motion.button>

              {/* Retrospective */}
              <motion.button
                onClick={() => setShowRetrospective(true)}
                whileHover={{ scale: 1.03, boxShadow: '0 0 14px rgba(167,139,250,0.3)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl font-bold transition-all cursor-pointer"
                style={{
                  padding: '7px 18px', fontSize: 14,
                  background: 'rgba(167,139,250,0.1)',
                  color: '#a78bfa',
                  border: '1px solid rgba(167,139,250,0.25)',
                  fontFamily: 'Space Grotesk',
                }}
              >
                <ClipboardList size={15} /> Retrospective
              </motion.button>

              {/* Daily Summary */}
              <motion.button
                onClick={() => setShowSummary(true)}
                disabled={!hasChoices}
                whileHover={hasChoices ? { scale: 1.03, boxShadow: '0 0 14px rgba(245,158,11,0.35)' } : {}}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  padding: '7px 18px', fontSize: 14,
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.12))',
                  color: '#f59e0b',
                  border: '1px solid rgba(245,158,11,0.3)',
                  fontFamily: 'Space Grotesk',
                }}
              >
                <Sparkles size={15} /> Daily Summary
              </motion.button>

              {/* Save Day */}
              <motion.button
                onClick={handleSaveDay}
                disabled={!account || timeline.events.length === 0}
                title={!account ? 'Sign in to save your day' : undefined}
                whileHover={account && timeline.events.length > 0 ? { scale: 1.03, boxShadow: '0 0 14px rgba(52,211,153,0.35)' } : {}}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  padding: '7px 12px', fontSize: 12,
                  background: saveStatus === 'saved' ? 'rgba(52,211,153,0.25)' : saveStatus === 'error' ? 'rgba(248,113,113,0.18)' : 'rgba(52,211,153,0.14)',
                  color: saveStatus === 'saved' ? '#34d399' : saveStatus === 'error' ? '#f87171' : '#34d399',
                  border: `1px solid ${saveStatus === 'saved' ? 'rgba(52,211,153,0.5)' : saveStatus === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(52,211,153,0.28)'}`,
                  fontFamily: 'Space Grotesk',
                }}
              >
                <Save size={12} />
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved!' : saveStatus === 'error' ? 'Error' : 'Save Day'}
              </motion.button>
            </div>}

            {/* Sign In / Sign Up prompt — hidden on mobile (shown in bottom sheet) */}
            {!account && !isMobile && (
              <motion.button
                onClick={() => setShowAuth(true)}
                whileHover={{ scale: 1.04, borderColor: 'rgba(52,211,153,0.6)', color: '#6ee7b7', boxShadow: '0 0 14px rgba(52,211,153,0.25)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 800, color: '#34d399',
                  fontFamily: 'Space Grotesk',
                  background: 'rgba(52,211,153,0.1)',
                  border: '1.5px solid rgba(52,211,153,0.35)',
                  borderRadius: 10, padding: '7px 12px',
                  whiteSpace: 'nowrap', cursor: 'pointer',
                }}
              >
                Sign In / Sign Up
              </motion.button>
            )}

            {/* History — desktop only */}
            {account && !isMobile && (
              <motion.button
                onClick={() => setShowHistory(true)}
                whileHover={{ scale: 1.04, boxShadow: '0 0 14px rgba(96,165,250,0.35)', borderColor: 'rgba(96,165,250,0.55)' }}
                whileTap={{ scale: 0.96 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 10, cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(59,130,246,0.1))',
                  color: '#60a5fa',
                  border: '1px solid rgba(96,165,250,0.35)',
                  fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 12,
                  boxShadow: '0 0 8px rgba(96,165,250,0.12)',
                }}
              >
                <CalendarDays size={12} /> History
              </motion.button>
            )}

            {/* Account — desktop only */}
            {account && !isMobile && (
              <div className="flex items-center gap-2">
                <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'Space Grotesk', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {account.name || account.email}
                </div>
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.04, boxShadow: '0 0 10px rgba(248,113,113,0.3)', borderColor: 'rgba(248,113,113,0.5)', color: '#f87171', background: 'rgba(248,113,113,0.12)' }}
                  whileTap={{ scale: 0.96 }}
                  title="Sign out"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 9px', borderRadius: 8, cursor: 'pointer',
                    border: '1px solid rgba(248,113,113,0.25)',
                    background: 'rgba(248,113,113,0.08)',
                    color: '#f87171',
                    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11,
                  }}
                >
                  <LogOut size={11} /> Log Out
                </motion.button>
              </div>
            )}

            {/* Mobile: sign-in button or save button */}
            {isMobile && !account && (
              <motion.button onClick={() => setShowAuth(true)} whileTap={{ scale: 0.95 }}
                style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: '7px 12px', fontFamily: 'Space Grotesk', cursor: 'pointer' }}>
                Sign In
              </motion.button>
            )}
            {isMobile && account && (
              <motion.button onClick={handleSaveDay} disabled={timeline.events.length === 0} whileTap={{ scale: 0.95 }}
                style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: '7px 12px', fontFamily: 'Space Grotesk', cursor: 'pointer', opacity: timeline.events.length === 0 ? 0.4 : 1 }}>
                <Save size={13} />
              </motion.button>
            )}

            {/* Profile */}
            <motion.button
              onClick={() => setShowIdentity(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ProfileAvatar profile={profile} compact />
              <Settings2 size={13} className="text-slate-600" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Main content — all views always mounted; framer-motion transitions ── */}
      <main className="flex-1 relative z-10 overflow-hidden" style={{ paddingBottom: isMobile ? 64 : 0 }}>
          <motion.div
            animate={{ opacity: view === VIEWS.SINGLE ? 1 : 0 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: view === VIEWS.SINGLE ? 'auto' : 'none', zIndex: view === VIEWS.SINGLE ? 2 : 1 }}
          >
              {/* Day Canvas */}
              <div className="flex-1 overflow-hidden" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <DayCanvas
                  timeline={timeline}
                  onSimulate={handleSimulate}
                  onSimulateAll={handleSimulateAll}
                  onSelectEvent={handleSelectEvent}
                  selectedEventId={selectedEventId}
                  dayLabel={profile.name ? `${profile.name}'s Day` : 'My Day'}
                  selectedOutfits={selectedOutfits}
                  onOutfitsChange={setSelectedOutfits}
                  selectedMood={selectedMood}
                  onMoodChange={setSelectedMood}
                />
              </div>
              {/* Right panel — desktop only; mobile gets a bottom sheet */}
              {!predictionFullscreen && !isMobile && (
                <motion.div
                  animate={{ width: predictionOpen ? predictionWidth : 40 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="shrink-0 flex flex-col relative"
                  style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#09090f', minWidth: 0, zIndex: 10, overflow: 'visible' }}
                >
                  {predictionOpen ? (
                    <>
                      {/* Drag-to-resize handle */}
                      {/* Drag-to-resize handle — straddles the panel's left border */}
                      <div
                        onMouseDown={handlePredictionResizeStart}
                        style={{ position: 'absolute', left: -12, top: 0, bottom: 0, width: 24, cursor: 'col-resize', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => {
                          e.currentTarget.querySelector('.resize-line').style.background = '#00d4b1';
                          e.currentTarget.querySelector('.resize-line').style.boxShadow = '0 0 8px rgba(0,212,177,0.6)';
                          e.currentTarget.querySelector('.resize-arrows').style.borderColor = 'rgba(0,212,177,0.7)';
                          e.currentTarget.querySelector('.resize-arrows').style.boxShadow = '0 0 12px rgba(0,212,177,0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.querySelector('.resize-line').style.background = 'rgba(255,255,255,0.15)';
                          e.currentTarget.querySelector('.resize-line').style.boxShadow = 'none';
                          e.currentTarget.querySelector('.resize-arrows').style.borderColor = 'rgba(0,212,177,0.35)';
                          e.currentTarget.querySelector('.resize-arrows').style.boxShadow = '0 0 6px rgba(0,212,177,0.12)';
                        }}
                      >
                        {/* Line sitting exactly on the border */}
                        <div className="resize-line" style={{ width: 2, height: '100%', background: 'rgba(255,255,255,0.15)', borderRadius: 2, transition: 'all 0.15s' }} />
                        {/* ‹ › pill centered on the border */}
                        <div className="resize-arrows" style={{
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          display: 'flex', alignItems: 'center', gap: 1,
                          background: 'rgba(9,9,15,0.95)',
                          border: '1px solid rgba(0,212,177,0.35)',
                          borderRadius: 8, padding: '5px 6px',
                          color: '#00d4b1', fontSize: 12, fontWeight: 900,
                          opacity: 1, transition: 'all 0.15s',
                          userSelect: 'none', pointerEvents: 'none',
                          whiteSpace: 'nowrap', lineHeight: 1,
                          boxShadow: '0 0 8px rgba(0,212,177,0.12)',
                        }}>
                          ‹ ›
                        </div>
                      </div>

                      {/* ── Tab bar ── */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px 10px 12px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>

                        {/* Collapse button — LEFT */}
                        <motion.button
                          onClick={() => setPredictionOpen(false)}
                          title="Collapse panel"
                          whileHover={{ scale: 1.08, background: 'rgba(255,255,255,0.14)', color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.3)' }}
                          whileTap={{ scale: 0.92 }}
                          style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.18)', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                        >
                          <ChevronsRight size={13} />
                        </motion.button>

                        {/* AI Predictions tab */}
                        {(() => {
                          const active = rightPanelTab === 'predictions';
                          return (
                            <motion.button
                              onClick={() => setRightPanelTab('predictions')}
                              whileHover={!active ? { background: 'rgba(0,212,177,0.18)', borderColor: 'rgba(0,212,177,0.5)', color: '#00d4b1', boxShadow: '0 0 14px rgba(0,212,177,0.2)' } : {}}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                                fontSize: 12, fontWeight: 800, fontFamily: 'Space Grotesk',
                                background: active ? 'linear-gradient(135deg, rgba(0,212,177,0.25), rgba(0,212,177,0.12))' : 'rgba(0,212,177,0.07)',
                                border: `2px solid ${active ? 'rgba(0,212,177,0.6)' : 'rgba(0,212,177,0.25)'}`,
                                color: active ? '#00d4b1' : '#5eead4',
                                boxShadow: active ? '0 0 16px rgba(0,212,177,0.25), inset 0 1px 0 rgba(0,212,177,0.1)' : 'none',
                                transition: 'all 0.15s',
                              }}>
                              <Sparkles size={15} />
                              AI Predictions
                            </motion.button>
                          );
                        })()}

                        {/* Today's Goals tab */}
                        {(() => {
                          const active     = rightPanelTab === 'goals';
                          const doneCount  = goals.filter(g => checkedGoals.has(g.id)).length;
                          return (
                            <motion.button
                              onClick={() => setRightPanelTab('goals')}
                              whileHover={!active ? { background: 'rgba(167,139,250,0.18)', borderColor: 'rgba(167,139,250,0.5)', color: '#a78bfa', boxShadow: '0 0 14px rgba(167,139,250,0.2)' } : {}}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                                fontSize: 12, fontWeight: 800, fontFamily: 'Space Grotesk',
                                background: active ? 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.12))' : 'rgba(167,139,250,0.07)',
                                border: `2px solid ${active ? 'rgba(167,139,250,0.6)' : 'rgba(167,139,250,0.25)'}`,
                                color: active ? '#a78bfa' : '#c4b5fd',
                                boxShadow: active ? '0 0 16px rgba(167,139,250,0.25), inset 0 1px 0 rgba(167,139,250,0.1)' : 'none',
                                transition: 'all 0.15s',
                              }}>
                              <Target size={20} />
                              Today's Goals
                              {goals.length > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 800, background: active ? 'rgba(167,139,250,0.3)' : 'rgba(167,139,250,0.15)', color: active ? '#c4b5fd' : '#a78bfa', borderRadius: 20, padding: '1px 6px', border: `1px solid ${active ? 'rgba(167,139,250,0.5)' : 'rgba(167,139,250,0.3)'}`, transition: 'all 0.15s' }}>
                                  {doneCount}/{goals.length}
                                </span>
                              )}
                            </motion.button>
                          );
                        })()}
                      </div>

                      {/* ── Panel body ── */}
                      <div className="flex-1 overflow-hidden flex flex-col">
                        {rightPanelTab === 'predictions' ? (
                          <PredictionPanel
                            prediction={activePrediction}
                            dayPrediction={dayPrediction}
                            isLoading={simProgress.active}
                            selectedSlot={selectedEventId}
                            onClose={() => setDayPrediction(null)}
                            isFullscreen={false}
                            onToggleFullscreen={() => setPredictionFullscreen(true)}
                            retroResult={retroResult}
                            onClearRetro={() => setRetroResult(null)}
                            summaryResult={summaryResult}
                            onClearSummary={() => setSummaryResult(null)}
                          />
                        ) : (
                          <RightPanelGoals
                            goals={goals}
                            checkedGoals={checkedGoals}
                            onToggle={toggleCheckedGoal}
                            onOpenGoalsModal={() => setShowGoals(true)}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    /* Collapsed rail — entire strip is one big click target */
                    <motion.button
                      onClick={() => setPredictionOpen(true)}
                      title="Expand panel"
                      whileHover={{ background: 'rgba(0,212,177,0.08)' }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        width: 40, height: '100%', cursor: 'pointer', border: 'none',
                        background: 'transparent',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        paddingTop: 14, gap: 12,
                        borderLeft: '2px solid rgba(0,212,177,0.15)',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderLeftColor = 'rgba(0,212,177,0.45)'}
                      onMouseLeave={e => e.currentTarget.style.borderLeftColor = 'rgba(0,212,177,0.15)'}
                    >
                      {/* Expand arrow */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: 'rgba(0,212,177,0.14)',
                        border: '1.5px solid rgba(0,212,177,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#00d4b1', flexShrink: 0,
                        boxShadow: '0 0 10px rgba(0,212,177,0.15)',
                      }}>
                        <ChevronsLeft size={16} />
                      </div>

                      {/* AI Predictions label */}
                      <div style={{
                        writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                        fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'rgba(0,212,177,0.6)',
                        fontFamily: 'Space Grotesk', userSelect: 'none',
                      }}>
                        AI Predictions
                      </div>
                      <Sparkles size={14} color="rgba(0,212,177,0.4)" />

                      {goals.length > 0 && (
                        <>
                          <div style={{ height: 1, width: 20, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                          <div style={{
                            writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                            fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: 'rgba(167,139,250,0.6)',
                            fontFamily: 'Space Grotesk', userSelect: 'none',
                          }}>
                            Goals
                          </div>
                          <Target size={14} color="rgba(167,139,250,0.4)" />
                        </>
                      )}
                    </motion.button>
                  )}
                </motion.div>
              )}
          </motion.div>

          <motion.div
            animate={{ opacity: view === VIEWS.PARALLEL ? 1 : 0 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', pointerEvents: view === VIEWS.PARALLEL ? 'auto' : 'none', zIndex: view === VIEWS.PARALLEL ? 2 : 1 }}
          >
            <ParallelDaysView
              profile={profile}
              count={2}
              mood={selectedMood}
              outfits={selectedOutfits}
              onTreeData={setTreeData}
              onShowFullscreen={setParallelFullscreen}
            />
          </motion.div>

          <motion.div
            animate={{ opacity: view === VIEWS.TREE ? 1 : 0 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: view === VIEWS.TREE ? 'auto' : 'none', zIndex: view === VIEWS.TREE ? 2 : 1 }}
          >
            <div className="flex-1 overflow-hidden">
              <BranchTreeView
                slots={timeline.slots}
                predictions={timeline.predictions}
                events={timeline.events}
                dayPrediction={dayPrediction}
                treeData={treeData}
                onNodeClick={handleNodeClick}
                profile={profile}
                mood={selectedMood}
                outfits={selectedOutfits}
              />
            </div>
            {activePrediction && (
              <div className="w-80 shrink-0" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                <PredictionPanel
                  prediction={activePrediction}
                  dayPrediction={dayPrediction}
                  isLoading={false}
                  selectedSlot={selectedEventId}
                  onClose={() => setSelectedEventId(null)}
                  onToggleFullscreen={() => setPredictionFullscreen(true)}
                />
              </div>
            )}
          </motion.div>
      </main>

      {/* ── Collapsible tree strip ── */}
      {view === VIEWS.SINGLE && timeline.events.length > 0 && (
        <div className="relative z-20 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <motion.button
            onClick={() => setTreeOpen(o => !o)}
            whileHover={{ background: 'rgba(255,255,255,0.03)' }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            <GitBranch size={11} />
            <span>Decision Tree</span>
            <motion.span animate={{ rotate: treeOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={11} />
            </motion.span>
          </motion.button>
          <AnimatePresence>
            {treeOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 260, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <BranchTreeView
                  slots={timeline.slots}
                  predictions={timeline.predictions}
                  onNodeClick={handleNodeClick}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <IdentityPanel
        isOpen={showIdentity}
        onClose={() => setShowIdentity(false)}
        profile={profile}
        onUpdate={handleProfileUpdate}
      />

      <DayGoals
        isOpen={showGoals}
        onClose={() => setShowGoals(false)}
        goals={goals}
        onGoalsChange={handleGoalsChange}
      />

      <AnimatePresence>
        {showRetrospective && (
          <DayRetrospective
            goals={goals}
            checkedGoals={checkedGoals}
            profile={profile}
            plannedEvents={timeline.events}
            onClose={() => setShowRetrospective(false)}
            onComplete={(result) => {
              setRetroResult(result);
              setShowRetrospective(false);
              setPredictionOpen(true);
              setRightPanelTab('predictions');
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAccountLogin} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <HistoryCalendar onClose={() => setShowHistory(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSummary && (
          <DailySummary
            choices={timeline.getAllChoices()}
            profile={profile}
            onClose={() => setShowSummary(false)}
            onComplete={(result) => setSummaryResult(result)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile bottom navigation ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          background: 'rgba(9,9,15,0.97)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
        }}>
          {VIEW_CONFIG.map(({ id, icon, shortLabel, color, colorRgb }) => {
            const active = view === id;
            const isExplore = id !== VIEWS.SINGLE;
            return (
              <motion.button
                key={id}
                onClick={() => setView(id)}
                whileTap={{ scale: 0.9 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 14px', borderRadius: 12, cursor: 'pointer', position: 'relative',
                  background: active ? `rgba(${colorRgb},0.15)` : isExplore ? `rgba(${colorRgb},0.06)` : 'transparent',
                  border: active ? `1px solid rgba(${colorRgb},0.35)` : isExplore ? `1px solid rgba(${colorRgb},0.18)` : '1px solid transparent',
                  color: active ? color : isExplore ? color : '#475569',
                  minWidth: 70,
                  boxShadow: active ? `0 0 10px rgba(${colorRgb},0.2)` : 'none',
                }}
              >
                {isExplore && !active && (
                  <span style={{
                    position: 'absolute', top: -5, right: 6,
                    fontSize: 8, fontWeight: 800, color, fontFamily: 'Space Grotesk',
                    background: `rgba(${colorRgb},0.18)`, border: `1px solid rgba(${colorRgb},0.35)`,
                    borderRadius: 20, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>new</span>
                )}
                <span style={{ fontSize: 18, opacity: active ? 1 : isExplore ? 0.85 : 0.5 }}>{icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Space Grotesk', letterSpacing: '0.02em' }}>{shortLabel}</span>
              </motion.button>
            );
          })}

          {/* Mobile AI prediction button */}
          {dayPrediction && (
            <motion.button
              onClick={() => setShowMobilePrediction(true)}
              whileTap={{ scale: 0.9 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 16px', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(167,139,250,0.12)',
                border: '1px solid rgba(167,139,250,0.25)',
                color: '#a78bfa', minWidth: 70,
              }}
            >
              <Zap size={18} />
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Space Grotesk' }}>AI</span>
            </motion.button>
          )}
        </nav>
      )}

      {/* ── Mobile prediction bottom sheet ── */}
      <AnimatePresence>
        {isMobile && showMobilePrediction && dayPrediction && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: '#09090f', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={16} color="#00d4b1" />
                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 15, color: '#f1f5f9', margin: 0 }}>AI Prediction</p>
              </div>
              <button onClick={() => setShowMobilePrediction(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 600 }}>
                Close
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <PredictionPanel
                dayPrediction={dayPrediction}
                isLoading={simProgress.active}
                onClose={() => setShowMobilePrediction(false)}
                onToggleFullscreen={() => { setShowMobilePrediction(false); setPredictionFullscreen(true); }}
                isFullscreen={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
    {/* ── Day Canvas prediction fullscreen ── */}
    <AnimatePresence>
      {predictionFullscreen && dayPrediction && (
        <DayPredictionFullscreen
          prediction={dayPrediction}
          eventCount={timeline.events.length}
          onMinimize={() => setPredictionFullscreen(false)}
          onClose={() => setPredictionFullscreen(false)}
        />
      )}
    </AnimatePresence>

    {/* ── Parallel view fullscreens — rendered outside main stacking context ── */}
    <AnimatePresence>
      {parallelFullscreen?.type === 'single' && (
        <DayPredictionFullscreen
          prediction={parallelFullscreen.data.prediction}
          eventCount={parallelFullscreen.data.eventCount}
          onMinimize={() => setParallelFullscreen(null)}
          onClose={() => setParallelFullscreen(null)}
        />
      )}
    </AnimatePresence>
    <AnimatePresence>
      {parallelFullscreen?.type === 'compare' && (
        <DayComparisonFullscreen
          result={parallelFullscreen.data.result}
          pathALabel={parallelFullscreen.data.pathALabel}
          pathBLabel={parallelFullscreen.data.pathBLabel}
          colorA={parallelFullscreen.data.colorA}
          colorB={parallelFullscreen.data.colorB}
          onClose={() => setParallelFullscreen(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
