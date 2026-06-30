// Interface Definitions
export interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline';
  db_threshold: number;
  alert_phone: string;
  current_db: number;
  last_seen: string;
}

export interface TelemetryData {
  device_id: string;
  date: string;
  avg_db_array: number[];
  peak_db_array: number[];
}

export interface AlertEvent {
  id: string;
  timestamp: number;
  peak_db: number;
  duration_minutes: number;
  threshold_config: number;
}

// Config API URL
const API_URL = import.meta.env.VITE_API_URL || "";

// Local Storage Keys for Sandbox Mode
const STORAGE_DEVICES = "noise_sentinel_devices";
const STORAGE_ALERTS = "noise_sentinel_alerts";

// Initial Sandbox Mock Data
const INITIAL_MOCK_DEVICES: Device[] = [
  {
    id: "sn-5d8f9",
    name: "Living Room (Main Node)",
    status: "online",
    db_threshold: 80,
    alert_phone: "+33 6 1234 5678",
    current_db: 58.4,
    last_seen: "Just now"
  },
  {
    id: "sn-3a2c4",
    name: "Balcony (Outdoors)",
    status: "online",
    db_threshold: 75,
    alert_phone: "+33 6 1234 5678",
    current_db: 78.2, // currently exceeding threshold
    last_seen: "Just now"
  },
  {
    id: "sn-9f12b",
    name: "Master Bedroom",
    status: "online",
    db_threshold: 70,
    alert_phone: "",
    current_db: 38.1,
    last_seen: "Just now"
  },
  {
    id: "sn-2b8e3",
    name: "Kitchen Sensor",
    status: "offline",
    db_threshold: 80,
    alert_phone: "",
    current_db: 0,
    last_seen: "2 hours ago"
  }
];

const INITIAL_MOCK_ALERTS: AlertEvent[] = [
  {
    id: "evt-101",
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 3, // 3 hours ago
    peak_db: 84.7,
    duration_minutes: 12,
    threshold_config: 75
  },
  {
    id: "evt-102",
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 24 * 2, // 2 days ago
    peak_db: 89.1,
    duration_minutes: 25,
    threshold_config: 80
  }
];

// Helper to seed localStorage
const getLocalStorageData = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

export const api = {
  // 1. Fetch all devices
  getDevices: async (): Promise<Device[]> => {
    if (!API_URL) {
      // Return local sandbox data
      const devices = getLocalStorageData(STORAGE_DEVICES, INITIAL_MOCK_DEVICES);
      // Simulate real-time fluctuating decibels for online devices
      return devices.map(d => {
        if (d.status === 'online') {
          const noiseRange = d.id === 'sn-3a2c4' ? 12 : 6; // Balcony is noisier
          const base = d.id === 'sn-3a2c4' ? 70 : 50;
          const randomChange = (Math.random() * noiseRange) - (noiseRange / 3.0);
          d.current_db = Math.round((base + randomChange) * 10) / 10;
        }
        return d;
      });
    }
    const res = await fetch(`${API_URL}/devices`);
    return res.json();
  },

  // 2. Update device configurations
  updateDevice: async (id: string, name: string, dbThreshold: number, alertPhone: string): Promise<{ status: string }> => {
    if (!API_URL) {
      const devices = getLocalStorageData<Device[]>(STORAGE_DEVICES, INITIAL_MOCK_DEVICES);
      const updated = devices.map(d => {
        if (d.id === id) {
          return { ...d, name, db_threshold: dbThreshold, alert_phone: alertPhone };
        }
        return d;
      });
      localStorage.setItem(STORAGE_DEVICES, JSON.stringify(updated));
      return { status: "success" };
    }
    const res = await fetch(`${API_URL}/devices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: jsonStringify({ name, db_threshold: dbThreshold, alert_phone: alertPhone })
    });
    return res.json();
  },

  // 3. Get 24h telemetry array for charts
  getDeviceHistory: async (id: string, dateStr: string): Promise<TelemetryData> => {
    if (!API_URL) {
      // Mock historical data generation
      const avgArray: number[] = [];
      const peakArray: number[] = [];
      
      // Generate 1440 data points representing a full day cycle
      for (let min = 0; min < 1440; min++) {
        let baseNoise = 45; // quiet floor
        
        // Quiet night hours (10 PM to 7 AM)
        if (min < 420 || min > 1320) {
          baseNoise = 38;
        }
        // Lunch hours noise rise (12 PM to 2 PM)
        else if (min >= 720 && min <= 840) {
          baseNoise = 55;
        }
        // Evening social hour noise rise (7 PM to 10 PM)
        else if (min >= 1140 && min <= 1320) {
          // If it's the balcony sensor, simulate a party event breach
          baseNoise = id === 'sn-3a2c4' ? 78 : 58;
        }

        const variance = (Math.random() * 8) - 4;
        const avg = Math.max(30, Math.round((baseNoise + variance) * 10) / 10);
        // Peak is usually 10-15 dB higher than average due to laughter, footsteps etc.
        const peak = Math.max(avg, Math.round((avg + Math.random() * 15) * 10) / 10);
        
        avgArray.push(avg);
        peakArray.push(peak);
      }

      return {
        device_id: id,
        date: dateStr,
        avg_db_array: avgArray,
        peak_db_array: peakArray
      };
    }
    const res = await fetch(`${API_URL}/devices/${id}/history?date=${dateStr}`);
    return res.json();
  },

  // 4. Retrieve alert logs
  getDeviceAlerts: async (id: string): Promise<AlertEvent[]> => {
    if (!API_URL) {
      const alerts = getLocalStorageData(STORAGE_ALERTS, INITIAL_MOCK_ALERTS);
      // Return alerts filtered by selected device
      return alerts;
    }
    const res = await fetch(`${API_URL}/devices/${id}/alerts`);
    return res.json();
  }
};

function jsonStringify(obj: Record<string, unknown>): string {
  return JSON.stringify(obj);
}
