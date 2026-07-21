import React, { useState, useEffect } from 'react';
import { api, Device, TelemetryData, AlertEvent, DeviceUpdate, getEffectiveThreshold, isQuietHoursActive } from './api';
import { DeviceGrid } from './components/DeviceGrid';
import { HistoryChart } from './components/HistoryChart';
import { AlertSettings } from './components/AlertSettings';
import {
  Building2,
  VolumeX,
  Calendar,
  Activity,
  HelpCircle,
  BellRing,
  Clock
} from 'lucide-react';

const App: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load: Fetch devices and alerts
  useEffect(() => {
    const initFetch = async () => {
      try {
        const devList = await api.getDevices();
        setDevices(devList);

        if (devList.length > 0) {
          setSelectedId(devList[0].id);
        }

        const alertList = await api.getDeviceAlerts("");
        setAlerts(alertList);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initFetch();
  }, []);

  // 2. Poll live device decibels every 3 seconds to keep UI "alive"
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const updatedDevices = await api.getDevices();
        setDevices(updatedDevices);
      } catch (err) {
        console.error("Error polling live telemetry:", err);
      }
    }, 3000);
    return () => clearInterval(pollInterval);
  }, []);

  // 3. Fetch telemetry history when active device selection changes
  useEffect(() => {
    if (!selectedId) return;

    const fetchHistory = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const data = await api.getDeviceHistory(selectedId, todayStr);
        setTelemetry(data);
      } catch (err) {
        console.error("Error fetching telemetry history:", err);
      }
    };
    fetchHistory();
  }, [selectedId]);

  const handleSaveConfig = async (id: string, update: DeviceUpdate) => {
    await api.updateDevice(id, update);
    // Refresh device list to update dashboard labels immediately
    const refreshed = await api.getDevices();
    setDevices(refreshed);
  };

  const selectedDevice = devices.find(d => d.id === selectedId);
  const selectedEffectiveThreshold = selectedDevice ? getEffectiveThreshold(selectedDevice) : 0;
  const selectedQuietHoursActive = selectedDevice ? isQuietHoursActive(selectedDevice) : false;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-900 justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
          <span className="text-sm font-semibold text-slate-400">Loading Sentinel Fleet...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">

      {/* 1. LEFT SIDEBAR (Sticky Navigation) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-slate-800 p-6">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-8 px-2">
          <div className="p-1.5 rounded-lg bg-sky-500 text-slate-950">
            <VolumeX className="h-5 w-5 font-bold" />
          </div>
          <span className="font-bold text-lg tracking-wide text-white">Noise Sentinel</span>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 space-y-1.5">
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-800 text-white font-semibold text-sm">
            <Activity className="h-4 w-4 text-sky-400" />
            <span>Monitors Fleet</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-sm font-semibold transition-colors">
            <Calendar className="h-4 w-4" />
            <span>Compliance Logs</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-sm font-semibold transition-colors">
            <HelpCircle className="h-4 w-4" />
            <span>Setup Wizard</span>
          </a>
        </nav>

        {/* Version label */}
        <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 font-semibold px-2">
          Sentinel Hub v1.0.0
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Main Header */}
        <header className="flex justify-between items-center px-6 py-4 bg-slate-950/40 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-400" />
            <h1 className="font-bold text-slate-200 text-sm tracking-wide">
              Tenant: Podinario Apartments
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-400 font-semibold bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg">
              Sandbox Demo Mode
            </span>
            <div className="h-8 w-8 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-bold text-sm">
              BM
            </div>
          </div>
        </header>

        {/* Dash Viewport */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">

          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Active Fleet Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time dBA environmental noise tracking and configurations</p>
          </div>

          {/* 3. FLEET DEVICE GRID */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Device Fleet Status</h2>
            </div>
            <DeviceGrid
              devices={devices}
              selectedId={selectedId}
              onSelectDevice={(id) => setSelectedId(id)}
            />
          </section>

          {/* 4. DETAIL LAYOUT (Charts & Settings) */}
          {selectedDevice && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Telemetry Line Charts */}
              <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">{selectedDevice.name}</h2>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{selectedDevice.id} | Live Telemetry History (dBA)</p>
                    </div>
                    {selectedDevice.status === 'online' && (
                      <div className="flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold text-sky-400">
                        <span>Live: {selectedDevice.current_db} dB</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-5 text-xs font-semibold">
                    <span className="bg-slate-900/70 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-300">
                      Active limit: {selectedEffectiveThreshold} dBA
                    </span>
                    <span className={`border px-2.5 py-1 rounded-lg ${
                      selectedDevice.alert_enabled
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-slate-900/70 border-slate-700 text-slate-500'
                    }`}>
                      Alerts {selectedDevice.alert_enabled ? 'enabled' : 'disabled'}
                    </span>
                    {selectedQuietHoursActive && (
                      <span className="bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-indigo-300">
                        Quiet hours active
                      </span>
                    )}
                  </div>
                  {telemetry ? (
                    <HistoryChart telemetry={telemetry} threshold={selectedEffectiveThreshold} />
                  ) : (
                    <div className="h-80 flex items-center justify-center text-slate-500 text-sm font-semibold">
                      Generating historical telemetry grid...
                    </div>
                  )}
                </div>

                {/* Chart Legends Info */}
                <div className="flex items-center gap-4 text-xs text-slate-400 bg-slate-900/40 border border-slate-800/80 px-4 py-2.5 rounded-lg mt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                    <span>Average dBA</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                    <span>Peak dBA</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 bg-red-500/50 border-t border-dashed border-red-500/50"></span>
                    <span>Alert Limit</span>
                  </div>
                </div>
              </div>

              {/* Threshold & Settings Editor */}
              <div>
                <AlertSettings device={selectedDevice} onSave={handleSaveConfig} />
              </div>
            </div>
          )}

          {/* 5. HISTORICAL ALERT LOGS TABLE */}
          <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-sky-400" />
                <h2 className="text-lg font-semibold text-slate-100">Noise Threshold Alert Events</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                Sustained Violations (&gt;10 min)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/50 border-b border-slate-700 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Code</th>
                    <th className="py-3 px-4">Target Device</th>
                    <th className="py-3 px-4">Configured Limit</th>
                    <th className="py-3 px-4 text-center">Duration</th>
                    <th className="py-3 px-4 text-right">Max dBA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {alerts.map((alert) => {
                    const alertDate = new Date(alert.timestamp * 1000).toLocaleString();
                    return (
                      <tr key={alert.id} className="hover:bg-slate-750 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-300">{alertDate}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-sky-400">{alert.id}</td>
                        <td className="py-3.5 px-4">Suite 302 - Balcony</td>
                        <td className="py-3.5 px-4 text-slate-400">{alert.threshold_config} dB</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-red-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {alert.duration_minutes} mins
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-red-400 font-bold">{alert.peak_db} dB</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>

    </div>
  );
};

export default App;
