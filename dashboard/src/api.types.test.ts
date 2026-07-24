import { describe, it, expect } from 'vitest';
import type { AlertEvent } from './api';

describe('AlertEvent type', () => {
  it('includes sound_class field', () => {
    const alert: AlertEvent = {
      id: 'evt-test',
      timestamp: Date.now() / 1000,
      peak_db: 85.0,
      duration_minutes: 10,
      threshold_config: 80,
      sound_class: 'crate_banging'
    };
    expect(alert.sound_class).toBe('crate_banging');
  });

  it('defaults sound_class to unknown when not provided', () => {
    const alert: AlertEvent = {
      id: 'evt-test',
      timestamp: Date.now() / 1000,
      peak_db: 85.0,
      duration_minutes: 10,
      threshold_config: 80,
      sound_class: 'unknown'
    };
    expect(alert.sound_class).toBe('unknown');
  });
});