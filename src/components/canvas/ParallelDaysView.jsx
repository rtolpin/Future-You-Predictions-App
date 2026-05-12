import { DayCanvas } from './DayCanvas.jsx';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useSimulation } from '../../hooks/useSimulation.js';

const DAY_CONFIGS = [
  { label: 'Path A', color: '#00d4b1' },
  { label: 'Path B', color: '#a78bfa' },
  { label: 'Path C', color: '#f59e0b' },
];

export function ParallelDaysView({ profile, count = 2, onSelectSlot }) {
  const timelines = [useTimeline(), useTimeline(), useTimeline()].slice(0, count);
  const simulations = [useSimulation(), useSimulation(), useSimulation()].slice(0, count);

  const handleSimulate = (timelineIdx) => async ({ timeKey, label, action, appearance, previousChoices }) => {
    const sim = simulations[timelineIdx];
    const tl = timelines[timelineIdx];
    tl.setLoading(timeKey, true);
    try {
      const result = await sim.simulate({ action, timeSlot: label, profile, previousChoices, appearance });
      tl.setPrediction(timeKey, result);
    } finally {
      tl.setLoading(timeKey, false);
    }
  };

  return (
    <div className="h-full flex divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      {timelines.map((timeline, i) => (
        <div key={i} className="flex-1 min-w-0 overflow-hidden">
          <DayCanvas
            timeline={timeline}
            dayLabel={DAY_CONFIGS[i].label}
            dayColor={DAY_CONFIGS[i].color}
            onSimulate={handleSimulate(i)}
            onSelectSlot={(timeKey) => onSelectSlot?.({ timeKey, dayIndex: i, timeline, simulation: simulations[i] })}
            defaultPanelsOpen={false}
          />
        </div>
      ))}
    </div>
  );
}
