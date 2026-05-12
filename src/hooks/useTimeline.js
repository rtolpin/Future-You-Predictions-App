import { useReducer, useCallback, useMemo } from 'react';

// minutes since midnight  e.g. 9:30 AM = 570
const initialState = {
  events: [],      // [{ id, card, startMinutes, durationMinutes }]
  predictions: {}, // { [eventId]: prediction }
  loading: {},     // { [eventId]: bool }
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_EVENT': {
      // prevent exact duplicates (same card at same start time)
      const dup = state.events.find(
        e => e.card.id === action.event.card.id && e.startMinutes === action.event.startMinutes
      );
      if (dup) return state;
      return { ...state, events: [...state.events, action.event] };
    }
    case 'REMOVE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.eventId) };
    case 'UPDATE_DURATION':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.eventId ? { ...e, durationMinutes: action.durationMinutes } : e
        ),
      };
    case 'UPDATE_LABEL':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.eventId
            ? { ...e, card: { ...e.card, label: action.label } }
            : e
        ),
      };
    case 'MOVE_EVENT':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.eventId ? { ...e, startMinutes: action.startMinutes } : e
        ),
      };
    case 'UPDATE_DETAILS':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.eventId
            ? { ...e, ...action.details }
            : e
        ),
      };
    case 'SET_PREDICTION':
      return { ...state, predictions: { ...state.predictions, [action.key]: action.prediction } };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.key]: action.loading } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function pad(n) { return String(n).padStart(2, '0'); }
export function minutesToLabel(m) {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${pad(h)}:${pad(min)}`;
}
export function minutesToKey(m) {
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function useTimeline() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addEvent = useCallback((startMinutes, card, durationMinutes = 60) => {
    dispatch({
      type: 'ADD_EVENT',
      event: { id: `${card.id}-${startMinutes}-${Date.now()}`, card, startMinutes, durationMinutes },
    });
  }, []);

  const removeEvent = useCallback((eventId) =>
    dispatch({ type: 'REMOVE_EVENT', eventId }), []);

  const updateDuration = useCallback((eventId, durationMinutes) =>
    dispatch({ type: 'UPDATE_DURATION', eventId, durationMinutes }), []);

  const updateLabel = useCallback((eventId, label) =>
    dispatch({ type: 'UPDATE_LABEL', eventId, label }), []);

  const moveEvent = useCallback((eventId, startMinutes) =>
    dispatch({ type: 'MOVE_EVENT', eventId, startMinutes }), []);

  const updateDetails = useCallback((eventId, details) =>
    dispatch({ type: 'UPDATE_DETAILS', eventId, details }), []);

  const setPrediction = useCallback((key, prediction) =>
    dispatch({ type: 'SET_PREDICTION', key, prediction }), []);

  const setLoading = useCallback((key, loading) =>
    dispatch({ type: 'SET_LOADING', key, loading }), []);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  // Kept for backward compat with App.jsx simulate logic
  const slots = useMemo(() =>
    state.events.reduce((acc, evt) => {
      const key = minutesToKey(evt.startMinutes);
      acc[key] = [...(acc[key] || []), evt.card];
      return acc;
    }, {}),
  [state.events]);

  const getAllChoices = useCallback(() =>
    [...state.events]
      .sort((a, b) => a.startMinutes - b.startMinutes)
      .map(evt => ({
        time: minutesToLabel(evt.startMinutes),
        action: evt.card.label,
        duration: evt.durationMinutes,
      })),
  [state.events]);

  return {
    events: state.events,
    slots,
    predictions: state.predictions,
    loading: state.loading,
    addEvent,
    removeEvent,
    updateDuration,
    updateLabel,
    moveEvent,
    updateDetails,
    setPrediction,
    setLoading,
    reset,
    getAllChoices,
  };
}
