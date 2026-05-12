import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppearanceSelector } from '../components/canvas/AppearanceSelector.jsx';

describe('AppearanceSelector', () => {
  it('renders all outfit options', () => {
    render(<AppearanceSelector selected={[]} onChange={vi.fn()} />);
    expect(screen.getByText('Sweatpants & Hoodie')).toBeInTheDocument();
    expect(screen.getByText('Pajamas')).toBeInTheDocument();
    expect(screen.getByText('Bathing Suit / Bikini')).toBeInTheDocument();
  });

  it('calls onChange with outfit id when chip is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<AppearanceSelector selected={[]} onChange={onChange} />);
    await user.click(screen.getByText('Pajamas'));
    expect(onChange).toHaveBeenCalledWith(['pajamas']);
  });

  it('removes outfit from selection when already selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<AppearanceSelector selected={['pajamas']} onChange={onChange} />);
    await user.click(screen.getByText('Pajamas'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('supports multi-select — adds to existing selection', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<AppearanceSelector selected={['jeans']} onChange={onChange} />);
    await user.click(screen.getByText('Athletic Wear'));
    expect(onChange).toHaveBeenCalledWith(['jeans', 'athletic']);
  });

  it('shows Clear button (indicating selection is active) when items are selected', () => {
    render(<AppearanceSelector selected={['jeans', 'athletic']} onChange={vi.fn()} />);
    // Clear button only appears when at least one item is selected
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('shows Clear button when items are selected', () => {
    render(<AppearanceSelector selected={['jeans']} onChange={vi.fn()} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('clears all selections when Clear is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<AppearanceSelector selected={['jeans', 'athletic']} onChange={onChange} />);
    await user.click(screen.getByText('Clear'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('does not show Clear when nothing is selected', () => {
    render(<AppearanceSelector selected={[]} onChange={vi.fn()} />);
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });
});
