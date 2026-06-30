import React, { useState, useEffect } from 'react';
import { Device } from '../api';
import { Sliders, Phone, Save, CheckCircle } from 'lucide-react';

interface AlertSettingsProps {
  device: Device;
  onSave: (id: string, name: string, dbThreshold: number, alertPhone: string) => Promise<void>;
}

export const AlertSettings: React.FC<AlertSettingsProps> = ({ device, onSave }) => {
  const [name, setName] = useState(device.name);
  const [threshold, setThreshold] = useState(device.db_threshold);
  const [phone, setPhone] = useState(device.alert_phone);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync state if selected device changed
  useEffect(() => {
    setName(device.name);
    setThreshold(device.db_threshold);
    setPhone(device.alert_phone);
    setShowSuccess(false);
  }, [device]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setShowSuccess(false);

    try {
      await onSave(device.id, name, threshold, phone);
      setShowSuccess(true);
      // Automatically hide success indicator after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

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
