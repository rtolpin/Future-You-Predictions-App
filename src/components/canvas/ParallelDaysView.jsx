import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DayCanvas } from './DayCanvas.jsx';
import { useTimeline, minutesToLabel } from '../../hooks/useTimeline.js';
import { simulateDayFlow } from '../../utils/claudeClient.js';
import { SimulationLoadingScreen } from '../simulation/SimulationLoadingScreen.jsx';
import { DayPredictionFullscreen } from '../prediction/DayPredictionFullscreen.jsx';

const DAY_CONFIGS = [
  { label: 'Path A', color: '#00d4b1' },
  { label: 'Path B', color: '#a78bfa' },
  { label: 'Path C', color: '#f59e0b' },
];

function useParallelTimelines(count) {
  const t0 = useTimeline();
  const t1 = useTimeline();
  const t2 = useTimeline();
  return [t0, t1, t2].slice(0, count);
}

export function ParallelDaysView({ profile, count = 2, mood, outfits }) {
  const timelines = useParallelTimelines(count);

  const [simProgress, setSimProgress] = useState({ active: false, currentAction: '' });
  const [dayPredictions, setDayPredictions] = useState([null, null, null]);
  const [fullscreenPath, setFullscreenPath] = useState(null); // index of path shown fullscreen

  const handleSimulateAll = useCallback((pathIndex) => async () => {
    const timeline = timelines[pathIndex];
    const events = timeline.events;
    if (!events || events.length === 0) return;

    const sorted = [...events].sort((a, b) => a.startMinutes - b.startMinutes);
    const eventPayload = sorted.map(e => ({
      label: e.card.label,
      time: minutesToLabel(e.startMinutes),
      duration: e.durationMinutes,
    }));

    setSimProgress({ active: true, currentAction: `${DAY_CONFIGS[pathIndex].label}` });
    try {
      const result = await simulateDayFlow({
        events: eventPayload,
        profile,
        mood,
        outfits,
      });
      setDayPredictions(prev => {
        const next = [...prev];
        next[pathIndex] = result;
        return next;
      });
      setFullscreenPath(pathIndex);
    } catch (err) {
      console.error('Parallel simulate error:', err);
    } finally {
      setSimProgress({ active: false, currentAction: '' });
    }
  }, [timelines, profile, mood, outfits]);

  return (
    <>
      <div className="h-full flex divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {timelines.map((timeline, i) => (
          <div key={i} className="flex-1 min-w-0 overflow-hidden">
            <DayCanvas
              timeline={timeline}
              dayLabel={DAY_CONFIGS[i].label}
              dayColor={DAY_CONFIGS[i].color}
              onSimulateAll={handleSimulateAll(i)}
              defaultPanelsOpen={false}
            />
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      <SimulationLoadingScreen
        active={simProgress.active}
        currentAction={simProgress.currentAction}
      />

      {/* Fullscreen prediction for the just-simulated path */}
      <AnimatePresence>
        {fullscreenPath !== null && dayPredictions[fullscreenPath] && (
          <DayPredictionFullscreen
            prediction={dayPredictions[fullscreenPath]}
            eventCount={timelines[fullscreenPath]?.events.length ?? 0}
            onMinimize={() => setFullscreenPath(null)}
            onClose={() => setFullscreenPath(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
