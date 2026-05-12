import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingForm } from '../components/onboarding/OnboardingForm.jsx';

// Mock MotivationalCarousel (it loads images which fail in jsdom)
vi.mock('../components/onboarding/MotivationalCarousel.jsx', () => ({
  MotivationalCarousel: () => <div data-testid="carousel" />,
}));
vi.mock('../utils/profileBuilder.js', () => ({
  defaultProfile: () => ({ name: '', city: 'New York, New York', mood: 6, energy: 6 }),
}));

describe('OnboardingForm', () => {
  it('renders the welcome screen with Begin Simulation button', () => {
    render(<OnboardingForm onComplete={vi.fn()} />);
    expect(screen.getByText('Begin Simulation')).toBeInTheDocument();
  });

  it('advances to step 1 when Begin Simulation is clicked', async () => {
    const user = userEvent.setup();
    render(<OnboardingForm onComplete={vi.fn()} />);
    await user.click(screen.getByText('Begin Simulation'));
    expect(await screen.findByText('Who are you today?')).toBeInTheDocument();
  });

  it('shows Skip setup link on welcome screen', () => {
    render(<OnboardingForm onComplete={vi.fn()} />);
    expect(screen.getByText(/skip setup/i)).toBeInTheDocument();
  });

  it('calls onComplete with default profile when Skip is clicked', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<OnboardingForm onComplete={onComplete} />);
    await user.click(screen.getByText(/skip setup/i));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][0]).toHaveProperty('city', 'New York, New York');
  });

  it('navigates back from step 2 to step 1', async () => {
    const user = userEvent.setup();
    render(<OnboardingForm onComplete={vi.fn()} />);
    await user.click(screen.getByText('Begin Simulation'));
    await screen.findByText('Who are you today?');
    await user.click(screen.getByText('Continue'));
    await screen.findByText('Your current situation');
    await user.click(screen.getByText('Back'));
    expect(await screen.findByText('Who are you today?')).toBeInTheDocument();
  });

  it('shows Skip button on form steps', async () => {
    const user = userEvent.setup();
    render(<OnboardingForm onComplete={vi.fn()} />);
    await user.click(screen.getByText('Begin Simulation'));
    await screen.findByText('Who are you today?');
    expect(screen.getByText(/skip setup/i)).toBeInTheDocument();
  });

  it('calls onComplete on final step Launch Simulation', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<OnboardingForm onComplete={onComplete} />);
    await user.click(screen.getByText('Begin Simulation'));
    await screen.findByText('Continue');
    await user.click(screen.getByText('Continue')); // step 1 → 2
    await screen.findByText('Continue');
    await user.click(screen.getByText('Continue')); // step 2 → 3
    await screen.findByText('Launch Simulation');
    await user.click(screen.getByText('Launch Simulation'));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('selecting a gender chip stores the value in profile', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<OnboardingForm onComplete={onComplete} />);
    // Skip setup — uses whatever profile has been set so far
    // First select Woman on the welcome screen's chip (visible after advancing)
    await user.click(screen.getByText('Begin Simulation'));
    await screen.findByText('Woman');
    await user.click(screen.getByText('Woman'));
    // Skip the rest via the Skip button
    await user.click(screen.getByText(/skip setup/i));
    expect(onComplete).toHaveBeenCalled();
    expect(onComplete.mock.calls[0][0].genderIdentity).toBe('Woman');
  });
});
