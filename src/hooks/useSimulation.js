import { useState, useCallback } from 'react';
import { simulateDecision } from '../utils/claudeClient.js';

export function useSimulation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePrediction, setActivePrediction] = useState(null);
  const [activeTimeKey, setActiveTimeKey] = useState(null);

  const simulate = useCallback(async ({ action, timeSlot, profile, previousChoices, appearance, onResult }) => {
    setIsLoading(true);
    setError(null);
    setActiveTimeKey(timeSlot);
    try {
      const result = await simulateDecision({ action, timeSlot, profile, previousChoices, appearance });
      setActivePrediction(result);
      onResult?.(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPrediction = useCallback(() => {
    setActivePrediction(null);
    setActiveTimeKey(null);
  }, []);

  return { simulate, isLoading, error, activePrediction, activeTimeKey, clearPrediction };
}
