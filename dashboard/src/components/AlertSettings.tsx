import React, { useState, useEffect } from 'react';
import { Device, DeviceUpdate, getEffectiveThreshold, isQuietHoursActive } from '../api';
import { Sliders, Phone, Save, CheckCircle, Bell, BellOff, Moon, Timer } from 'lucide-react';

interface AlertSettingsProps {
  device: Device;
  onSave: (id: string, update: DeviceUpdate) => Promise<void>;
}

export const AlertSettings: React.FC<AlertSettingsProps> = ({ device, onSave }) => {
  const [name, setName] = useState(device.name);
  const [alertEnabled, setAlertEnabled] = useState(device.alert_enabled);
  const [threshold, setThreshold] = useState(device.db_threshold);
  const [duration, setDuration] = useState(device.alert_duration_minutes);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(device.quiet_hours_enabled);
  const [quietHoursStart, setQuietHoursStart] = useState(device.quiet_hours_start);
  const [quietHoursEnd, setQuietHoursEnd] = useState(device.quiet_hours_end);
  const [quietHoursThreshold, setQuietHoursThreshold] = useState(device.quiet_hours_db_threshold);
  const [phone, setPhone] = useState(device.alert_phone);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync state if selected device changed
  useEffect(() => {
    setName(device.name);
    setAlertEnabled(device.alert_enabled);
    setThreshold(device.db_threshold);
    setDuration(device.alert_duration_minutes);
    setQuietHoursEnabled(device.quiet_hours_enabled);
    setQuietHoursStart(device.quiet_hours_start);
    setQuietHoursEnd(device.quiet_hours_end);
    setQuietHoursThreshold(device.quiet_hours_db_threshold);
    setPhone(device.alert_phone);
    setShowSuccess(false);
  }, [device.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setShowSuccess(false);

    try {
      await onSave(device.id, {
        name,
        alert_enabled: alertEnabled,
        db_threshold: threshold,
        alert_duration_minutes: duration,
        quiet_hours_enabled: quietHoursEnabled,
        quiet_hours_start: quietHoursStart,
        quiet_hours_end: quietHoursEnd,
        quiet_hours_db_threshold: quietHoursThreshold,
        alert_phone: phone
      });
      setShowSuccess(true);
      // Automatically hide success indicator after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const previewDevice: Device = {
    ...device,
    name,
    alert_enabled: alertEnabled,
    db_threshold: threshold,
    alert_duration_minutes: duration,
    quiet_hours_enabled: quietHoursEnabled,
    quiet_hours_start: quietHoursStart,
    quiet_hours_end: quietHoursEnd,
    quiet_hours_db_threshold: quietHoursThreshold,
    alert_phone: phone
  };
  const effectiveThreshold = getEffectiveThreshold(previewDevice);
  const quietHoursActive = isQuietHoursActive(previewDevice);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sliders className="h-5 w-5 text-sky-400" />
        <h2 className="text-lg font-semibold text-slate-100">Device Configurations</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Device ID (Read-only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Device Serial ID
          </label>
          <input
            type="text"
            value={device.id}
            disabled
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-500 font-mono text-sm cursor-not-allowed"
          />
        </div>

        {/* Friendly Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Friendly Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
          />
        </div>

        {/* Alert Enablement */}
        <label className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 cursor-pointer">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            {alertEnabled ? <Bell className="h-4 w-4 text-green-400" /> : <BellOff className="h-4 w-4 text-slate-500" />}
            SMS Alerting
          </span>
          <input
            type="checkbox"
            checked={alertEnabled}
            onChange={(e) => setAlertEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-sky-500"
          />
        </label>

        {/* Threshold Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Noise Alert Threshold
            </label>
            <span className="text-sm font-bold text-sky-400">{threshold} dBA</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>50 dB (Quiet Room)</span>
            <span>75 dB (Moderate)</span>
            <span>95 dB (Very Loud)</span>
          </div>
        </div>

        {/* Sustained Duration */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <Timer className="h-3.5 w-3.5" />
            Sustained Duration
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="60"
              value={duration}
              onChange={(e) => setDuration(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sky-500 text-sm"
            />
            <span className="text-sm text-slate-400">minutes above limit before SMS</span>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-3 border-t border-slate-700 pt-5">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Moon className="h-4 w-4 text-indigo-300" />
              Quiet Hours
            </span>
            <input
              type="checkbox"
              checked={quietHoursEnabled}
              onChange={(e) => setQuietHoursEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-sky-500"
            />
          </label>

          {quietHoursEnabled && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Start
                  </label>
                  <input
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-sky-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    End
                  </label>
                  <input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-sky-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Quiet Limit
                  </label>
                  <span className="text-sm font-bold text-indigo-300">{quietHoursThreshold} dBA</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="1"
                  value={quietHoursThreshold}
                  onChange={(e) => setQuietHoursThreshold(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>
            </>
          )}
        </div>

        {/* Alert Contacts */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Alert SMS Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
            <input
              type="tel"
              placeholder="+33 6 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
            />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-3 text-xs text-slate-400">
          Active limit preview: <span className="font-bold text-slate-200">{effectiveThreshold} dBA</span>
          {quietHoursActive && <span className="ml-2 text-indigo-300">Quiet hours active now</span>}
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Config'}</span>
          </button>
          
          {showSuccess && (
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
              <CheckCircle className="h-4 w-4" />
              <span>Configurations Saved!</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
