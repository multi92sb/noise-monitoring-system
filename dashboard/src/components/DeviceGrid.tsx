import React from 'react';
import { Device } from '../api';
import { Volume2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface DeviceGridProps {
  devices: Device[];
  selectedId: string;
  onSelectDevice: (id: string) => void;
}

export const DeviceGrid: React.FC<DeviceGridProps> = ({
  devices,
  selectedId,
  onSelectDevice
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {devices.map((device) => {
        const isSelected = device.id === selectedId;
        const isOnline = device.status === 'online';
        const isExceeded = isOnline && device.current_db > device.db_threshold;

        return (
          <button
            key={device.id}
            onClick={() => onSelectDevice(device.id)}
            className={`w-full text-left p-5 rounded-xl border transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${
              isSelected
                ? 'bg-slate-800 border-sky-500 shadow-lg shadow-sky-500/10'
                : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-sky-400">
                <Volume2 className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700">
                {isOnline ? (
                  <>
                    <span className={`h-2 w-2 rounded-full bg-green-500 ${isExceeded ? 'pulse-indicator-danger' : 'pulse-indicator'}`}></span>
                    <span className="text-green-400">Online</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                    <span className="text-slate-400">Offline</span>
                  </>
                )}
              </div>
            </div>

            <h3 className="font-semibold text-slate-100 mb-1 truncate">{device.name}</h3>
            <p className="text-xs text-slate-400 font-mono mb-4">{device.id}</p>

            {isOnline ? (
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-bold tracking-tight text-white">
                    {device.current_db} <span className="text-xs font-normal text-slate-400">dBA</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Threshold: {device.db_threshold} dB
                  </p>
                </div>
                {isExceeded && (
                  <div className="flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    <AlertTriangle className="h-4 w-4 pulse-indicator-danger" />
                    <span>Loud</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center text-slate-400 mt-4 py-1.5">
                <span className="text-xs">Last Active</span>
                <span className="text-xs font-semibold">{device.last_seen}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
