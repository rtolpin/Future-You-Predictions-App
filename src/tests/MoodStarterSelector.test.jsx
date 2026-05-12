import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoodStarterSelector } from '../components/canvas/MoodStarterSelector.jsx';

describe('MoodStarterSelector', () => {
  it('renders all mood options including Happy', () => {
    render(<MoodStarterSelector selected={null} onChange={vi.fn()} />);
    expect(screen.getByText('Motivated')).toBeInTheDocument();
    expect(screen.getByText('Happy')).toBeInTheDocument();
    expect(screen.getByText('Anxious')).toBeInTheDocument();
    expect(screen.getByText('Calm')).toBeInTheDocument();
  });

  it('calls onChange with mood id when clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MoodStarterSelector selected={null} onChange={onChange} />);
    await user.click(screen.getByText('Happy'));
    expect(onChange).toHaveBeenCalledWith('happy');
  });

  it('deselects mood when same mood is clicked again', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MoodStarterSelector selected="happy" onChange={onChange} />);
    await user.click(screen.getByText('Happy'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows Clear when a mood is selected', () => {
    render(<MoodStarterSelector selected="motivated" onChange={vi.fn()} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('shows Pick one when nothing is selected', () => {
    render(<MoodStarterSelector selected={null} onChange={vi.fn()} />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('clears selection when Clear is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MoodStarterSelector selected="calm" onChange={onChange} />);
    await user.click(screen.getByText('Clear'));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
