import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GitBranch, Layers, LayoutDashboard, Sparkles, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Settings2, Minimize2, X, Save, CalendarDays, LogOut, UserCircle, Menu, Zap } from 'lucide-react';
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
  { id: VIEWS.SINGLE, icon: <LayoutDashboard size={13} />, label: 'Day Canvas' },
  { id: VIEWS.PARALLEL, icon: <Layers size={13} />, label: 'Parallel Days Comparison' },
  { id: VIEWS.TREE, icon: <GitBranch size={13} />, label: 'Day Decisions Tree Builder' },
];

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
    setAccount(null);
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
              <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: isMobile ? 13 : 14, color: '#f1f5f9', lineHeight: 1.2 }}>Future You</h1>
              {!isMobile && <p className="text-xs text-slate-600 leading-tight">AI Life Simulator</p>}
            </div>
          </motion.button>

          {/* View tabs — desktop only; mobile uses bottom nav */}
          {!isMobile && (
            <div className="flex items-center gap-2 p-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {VIEW_CONFIG.map(({ id, icon, label }) => {
                const active = view === id;
                return (
                  <motion.button key={id} onClick={() => setView(id)}
                    whileHover={!active ? { background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' } : {}}
                    whileTap={{ scale: 0.95 }}
                    className="relative flex items-center rounded-xl font-semibold transition-all cursor-pointer"
                    style={{ gap: 8, padding: '10px 20px', fontSize: 13, color: active ? '#00d4b1' : '#475569', fontFamily: 'Space Grotesk' }}
                  >
                    {active && (
                      <motion.div layoutId="active-tab" className="absolute inset-0 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, rgba(0,212,177,0.18), rgba(0,212,177,0.08))', border: '1px solid rgba(0,212,177,0.35)', boxShadow: '0 0 16px rgba(0,212,177,0.15)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center" style={{ gap: 7 }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      {label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center" style={{ gap: isMobile ? 8 : 12 }}>

            {/* ── Action group: Daily Summary + Save Day — hidden on mobile ── */}
            {!isMobile && <div
              className="flex items-stretch gap-2 p-1.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Daily Summary */}
              <motion.button
                onClick={() => setShowSummary(true)}
                disabled={!hasChoices}
                whileHover={hasChoices ? { scale: 1.03, boxShadow: '0 0 18px rgba(245,158,11,0.4)' } : {}}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  padding: '9px 16px', fontSize: 13,
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.12))',
                  color: '#f59e0b',
                  border: '1px solid rgba(245,158,11,0.3)',
                  fontFamily: 'Space Grotesk',
                }}
              >
                <Sparkles size={14} /> Daily Summary
              </motion.button>

              {/* Divider */}
              <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch', borderRadius: 2 }} />

              {/* Save Day */}
              <motion.button
                onClick={handleSaveDay}
                disabled={!account || timeline.events.length === 0}
                title={!account ? 'Sign in to save your day' : undefined}
                whileHover={account && timeline.events.length > 0 ? { scale: 1.03, boxShadow: '0 0 18px rgba(52,211,153,0.4)' } : {}}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  padding: '9px 16px', fontSize: 13,
                  background: saveStatus === 'saved' ? 'rgba(52,211,153,0.25)' : saveStatus === 'error' ? 'rgba(248,113,113,0.18)' : 'rgba(52,211,153,0.14)',
                  color: saveStatus === 'saved' ? '#34d399' : saveStatus === 'error' ? '#f87171' : '#34d399',
                  border: `1px solid ${saveStatus === 'saved' ? 'rgba(52,211,153,0.5)' : saveStatus === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(52,211,153,0.28)'}`,
                  fontFamily: 'Space Grotesk',
                }}
              >
                <Save size={14} />
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved!' : saveStatus === 'error' ? 'Error' : 'Save Day'}
              </motion.button>
            </div>}

            {/* Sign In / Sign Up prompt — hidden on mobile (shown in bottom sheet) */}
            {!account && !isMobile && (
              <motion.button
                onClick={() => setShowAuth(true)}
                whileHover={{ scale: 1.04, borderColor: 'rgba(52,211,153,0.6)', color: '#6ee7b7', boxShadow: '0 0 14px rgba(52,211,153,0.25)' }}
                whileTap={{ scale: 0.97 }}
                className="cursor-pointer transition-all text-center"
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#34d399',
                  fontFamily: 'Space Grotesk',
                  background: 'rgba(52,211,153,0.1)',
                  border: '1.5px solid rgba(52,211,153,0.35)',
                  borderRadius: 12,
                  padding: '8px 14px',
                  maxWidth: 130,
                  lineHeight: 1.45,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                Sign In / Sign Up to Save Day
              </motion.button>
            )}

            {/* History — desktop only */}
            {account && !isMobile && (
              <motion.button
                onClick={() => setShowHistory(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}
              >
                <CalendarDays size={12} /> History
              </motion.button>
            )}

            {/* Account — desktop only */}
            {account && !isMobile && (
              <div className="flex items-center gap-2">
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'Space Grotesk', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {account.name || account.email}
                </div>
                <motion.button onClick={handleLogout} whileHover={{ scale: 1.05, color: '#f87171' }} whileTap={{ scale: 0.95 }}
                  title="Sign out"
                  className="flex items-center justify-center cursor-pointer transition-colors"
                  style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#475569' }}>
                  <LogOut size={13} />
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

      {/* ── Main content — all views always mounted; CSS show/hide preserves state ── */}
      <main className="flex-1 relative z-10 overflow-hidden" style={{ paddingBottom: isMobile ? 64 : 0 }}>
          <div
            className="h-full flex"
            style={{ display: view === VIEWS.SINGLE ? 'flex' : 'none' }}
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
                  className="shrink-0 flex flex-col overflow-hidden relative"
                  style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#09090f', minWidth: 0 }}
                >
                  {predictionOpen ? (
                    <>
                      {/* Drag-to-resize handle */}
                      <div
                        onMouseDown={handlePredictionResizeStart}
                        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <div style={{ width: 2, height: 40, borderRadius: 2, background: 'rgba(255,255,255,0.08)', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,177,0.5)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        />
                      </div>
                      {/* Collapse button */}
                      <div style={{ position: 'absolute', top: 14, left: 10, zIndex: 20 }}>
                        <button
                          onClick={() => setPredictionOpen(false)}
                          title="Collapse prediction panel"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 6,
                            padding: '3px 6px',
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden" style={{ paddingLeft: 28 }}>
                        <PredictionPanel
                          prediction={activePrediction}
                          dayPrediction={dayPrediction}
                          isLoading={simProgress.active}
                          selectedSlot={selectedEventId}
                          onClose={() => setDayPrediction(null)}
                          isFullscreen={false}
                          onToggleFullscreen={() => setPredictionFullscreen(true)}
                        />
                      </div>
                    </>
                  ) : (
                    /* Collapsed rail */
                    <div className="flex flex-col items-center h-full" style={{ width: 40, paddingTop: 12, gap: 0 }}>
                      <button
                        onClick={() => setPredictionOpen(true)}
                        title="Expand prediction panel"
                        style={{
                          background: 'rgba(0,212,177,0.1)',
                          border: '1px solid rgba(0,212,177,0.25)',
                          borderRadius: 6,
                          padding: '6px 7px',
                          cursor: 'pointer',
                          color: '#00d4b1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <div
                        style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'rgba(0,212,177,0.35)',
                          userSelect: 'none',
                          marginTop: 4,
                        }}
                      >
                        AI Prediction
                      </div>
                      <Sparkles size={13} style={{ color: 'rgba(0,212,177,0.2)', marginTop: 10 }} />
                    </div>
                  )}
                </motion.div>
              )}
          </div>

          <div
            className="h-full"
            style={{ display: view === VIEWS.PARALLEL ? 'flex' : 'none', flexDirection: 'column' }}
          >
            <ParallelDaysView
              profile={profile}
              count={2}
              mood={selectedMood}
              outfits={selectedOutfits}
              onTreeData={setTreeData}
              onShowFullscreen={setParallelFullscreen}
            />
          </div>

          <div
            className="h-full flex"
            style={{ display: view === VIEWS.TREE ? 'flex' : 'none' }}
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
          </div>
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
          {VIEW_CONFIG.map(({ id, icon, label }) => {
            const active = view === id;
            const shortLabel = id === VIEWS.SINGLE ? 'Canvas' : id === VIEWS.PARALLEL ? 'Parallel' : 'Tree';
            return (
              <motion.button
                key={id}
                onClick={() => setView(id)}
                whileTap={{ scale: 0.9 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 16px', borderRadius: 12, cursor: 'pointer',
                  background: active ? 'rgba(0,212,177,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(0,212,177,0.25)' : '1px solid transparent',
                  color: active ? '#00d4b1' : '#475569',
                  minWidth: 70,
                }}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
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
