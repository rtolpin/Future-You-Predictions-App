import { useState, useCallback } from 'react';
import { useTimeline } from './useTimeline.js';

export function useParallelDays(count = 2) {
  const [dayCount] = useState(count);
  const day1 = useTimeline();
  const day2 = useTimeline();
  const day3 = useTimeline();

  const days = [day1, day2, day3].slice(0, dayCount);

  const dayLabels = ['Day A', 'Day B', 'Day C'];
  const dayColors = ['#00d4b1', '#a78bfa', '#f59e0b'];

  return { days, dayLabels, dayColors };
}
