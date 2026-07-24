import { describe, it, expect } from 'vitest';
import { isQuietHoursActive, getEffectiveThreshold } from './api';
import type { Device } from './api';

const baseDevice: Device = {
  id: 'sn-test',
  name: 'Test Device',
  status: 'online',
  alert_enabled: true,
  db_threshold: 80,
  alert_duration_minutes: 10,
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  quiet_hours_db_threshold: 65,
  alert_phone: '',
  current_db: 50,
  last_seen: 'now'
};

describe('isQuietHoursActive', () => {
  it('returns false when quiet hours are disabled', () => {
    const device = { ...baseDevice, quiet_hours_enabled: false };
    expect(isQuietHoursActive(device, new Date('2026-07-23T23:00:00'))).toBe(false);
  });

  it('returns true during quiet hours that cross midnight', () => {
    expect(isQuietHoursActive(baseDevice, new Date('2026-07-23T23:30:00'))).toBe(true);
    expect(isQuietHoursActive(baseDevice, new Date('2026-07-23T06:30:00'))).toBe(true);
  });

  it('returns false outside quiet hours', () => {
    expect(isQuietHoursActive(baseDevice, new Date('2026-07-23T12:00:00'))).toBe(false);
  });
});

describe('getEffectiveThreshold', () => {
  it('returns the quiet-hours threshold during quiet hours', () => {
    expect(getEffectiveThreshold(baseDevice, new Date('2026-07-23T23:30:00'))).toBe(65);
  });

  it('returns the normal threshold outside quiet hours', () => {
    expect(getEffectiveThreshold(baseDevice, new Date('2026-07-23T12:00:00'))).toBe(80);
  });
});