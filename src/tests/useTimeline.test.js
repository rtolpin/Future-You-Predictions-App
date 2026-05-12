import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimeline } from '../hooks/useTimeline.js';

describe('useTimeline', () => {
  let result;

  beforeEach(() => {
    ({ result } = renderHook(() => useTimeline()));
  });

  // ── addEvent ──────────────────────────────────────────
  describe('addEvent', () => {
    it('adds an event to the timeline', () => {
      const card = { id: 'act-run', label: 'Morning Run', icon: '🏃', category: 'activity' };
      act(() => result.current.addEvent(480, card, 60)); // 8:00 AM, 60 min
      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].startMinutes).toBe(480);
      expect(result.current.events[0].durationMinutes).toBe(60);
      expect(result.current.events[0].card.id).toBe('act-run');
    });

    it('does not add duplicate event (same card + same start time)', () => {
      const card = { id: 'act-run', label: 'Morning Run', icon: '🏃', category: 'activity' };
      act(() => result.current.addEvent(480, card, 60));
      act(() => result.current.addEvent(480, card, 60));
      expect(result.current.events).toHaveLength(1);
    });

    it('allows same card at different times', () => {
      const card = { id: 'act-run', label: 'Morning Run', icon: '🏃', category: 'activity' };
      act(() => result.current.addEvent(480, card, 60));
      act(() => result.current.addEvent(600, card, 30));
      expect(result.current.events).toHaveLength(2);
    });

    it('defaults duration to 60 minutes', () => {
      const card = { id: 'act-run', label: 'Run', icon: '🏃', category: 'activity' };
      act(() => result.current.addEvent(480, card));
      expect(result.current.events[0].durationMinutes).toBe(60);
    });
  });

  // ── removeEvent ───────────────────────────────────────
  describe('removeEvent', () => {
    it('removes an event by id', () => {
      const card = { id: 'act-run', label: 'Run', icon: '🏃', category: 'activity' };
      act(() => result.current.addEvent(480, card, 60));
      const eventId = result.current.events[0].id;
      act(() => result.current.removeEvent(eventId));
      expect(result.current.events).toHaveLength(0);
    });

    it('does not affect other events when removing one', () => {
      const card1 = { id: 'act-run', label: 'Run', icon: '🏃', category: 'activity' };
      const card2 = { id: 'act-yoga', label: 'Yoga', icon: '🧘', category: 'fitness' };
      act(() => { result.current.addEvent(480, card1, 60); result.current.addEvent(600, card2, 45); });
      const firstId = result.current.events[0].id;
      act(() => result.current.removeEvent(firstId));
      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].card.id).toBe('act-yoga');
    });
  });

  // ── updateDuration ────────────────────────────────────
  describe('updateDuration', () => {
    it('updates the duration of an event', () => {
      const card = { id: 'act-run', label: 'Run', icon: '🏃', category: 'activity' };
      act(() => result.current.addEvent(480, card, 60));
      const eventId = result.current.events[0].id;
      act(() => result.current.updateDuration(eventId, 90));
      expect(result.current.events[0].durationMinutes).toBe(90);
    });
  });

  // ── moveEvent ─────────────────────────────────────────
  describe('moveEvent', () => {
    it('moves an event to a new start time', () => {
      const card = { id: 'act-run', label: 'Run', icon: '🏃', category: 'activity' };
      act(() => result.current.addEvent(480, card, 60));
      const eventId = result.current.events[0].id;
      act(() => result.current.moveEvent(eventId, 540));
      expect(result.current.events[0].startMinutes).toBe(540);
    });
  });

  // ── updateLabel ───────────────────────────────────────
  describe('updateLabel', () => {
    it('updates the card label of an event', () => {
      const card = { id: 'act-hair-custom', label: 'Hair Colored — Custom', icon: '🖌️', category: 'activity' };
      act(() => result.current.addEvent(600, card, 120));
      const eventId = result.current.events[0].id;
      act(() => result.current.updateLabel(eventId, 'Hair Colored — Copper'));
      expect(result.current.events[0].card.label).toBe('Hair Colored — Copper');
    });
  });

  // ── updateDetails ─────────────────────────────────────
  describe('updateDetails', () => {
    it('stores description and location on an event', () => {
      const card = { id: 'act-gym', label: 'Gym', icon: '💪', category: 'activity' };
      act(() => result.current.addEvent(420, card, 60));
      const eventId = result.current.events[0].id;
      act(() => result.current.updateDetails(eventId, { description: 'Leg day', location: 'Equinox Midtown' }));
      expect(result.current.events[0].description).toBe('Leg day');
      expect(result.current.events[0].location).toBe('Equinox Midtown');
    });

    it('stores custom color on an event', () => {
      const card = { id: 'act-yoga', label: 'Yoga', icon: '🧘', category: 'fitness' };
      act(() => result.current.addEvent(360, card, 60));
      const eventId = result.current.events[0].id;
      act(() => result.current.updateDetails(eventId, { customColor: '#f43f5e' }));
      expect(result.current.events[0].customColor).toBe('#f43f5e');
    });
  });

  // ── setPrediction / setLoading ────────────────────────
  describe('setPrediction & setLoading', () => {
    it('stores a prediction keyed by event id', () => {
      const card = { id: 'act-run', label: 'Run', icon: '🏃', category: 'activity' };
      act(() => result.current.addEvent(480, card, 60));
      const eventId = result.current.events[0].id;
      const pred = { scene: 'You are in Central Park.', scores: { overall: 8 } };
      act(() => result.current.setPrediction(eventId, pred));
      expect(result.current.predictions[eventId].scene).toBe('You are in Central Park.');
    });

    it('sets and clears loading state', () => {
      act(() => result.current.setLoading('some-event-id', true));
      expect(result.current.loading['some-event-id']).toBe(true);
      act(() => result.current.setLoading('some-event-id', false));
      expect(result.current.loading['some-event-id']).toBe(false);
    });
  });

  // ── slots compat ──────────────────────────────────────
  describe('slots (backward compat)', () => {
    it('exposes a slots object keyed by HH:MM', () => {
      const card = { id: 'act-run', label: 'Run', icon: '🏃', category: 'activity' };
      act(() => result.current.addEvent(540, card, 60)); // 09:00
      expect(result.current.slots['09:00']).toBeDefined();
      expect(result.current.slots['09:00'][0].id).toBe('act-run');
    });
  });

  // ── getAllChoices ─────────────────────────────────────
  describe('getAllChoices', () => {
    it('returns sorted list of choices', () => {
      const c1 = { id: 'act-yoga', label: 'Yoga', icon: '🧘', category: 'fitness' };
      const c2 = { id: 'act-run',  label: 'Run',  icon: '🏃', category: 'activity' };
      act(() => { result.current.addEvent(600, c1, 60); result.current.addEvent(480, c2, 30); });
      const choices = result.current.getAllChoices();
      expect(choices[0].action).toBe('Run');   // 480 comes first
      expect(choices[1].action).toBe('Yoga');  // 600 is after
    });
  });

  // ── reset ─────────────────────────────────────────────
  describe('reset', () => {
    it('clears all events, predictions, and loading', () => {
      const card = { id: 'act-run', label: 'Run', icon: '🏃', category: 'activity' };
      act(() => { result.current.addEvent(480, card, 60); result.current.setLoading('x', true); });
      act(() => result.current.reset());
      expect(result.current.events).toHaveLength(0);
      expect(Object.keys(result.current.predictions)).toHaveLength(0);
      expect(Object.keys(result.current.loading)).toHaveLength(0);
    });
  });
});
