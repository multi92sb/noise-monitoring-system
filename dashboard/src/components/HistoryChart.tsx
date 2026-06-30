import React from 'react';
import { Line } from 'react-chartjs-2';
import { TelemetryData } from '../api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HistoryChartProps {
  telemetry: TelemetryData;
  threshold: number;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ telemetry, threshold }) => {
  // Sample 1,440 minutes down to once every 10 minutes (144 points) to optimize mobile performance
  const samplingRate = 10;
  const sampledAvg = telemetry.avg_db_array.filter((_, idx) => idx % samplingRate === 0);
  const sampledPeak = telemetry.peak_db_array.filter((_, idx) => idx % samplingRate === 0);

  // Generate X-Axis labels (e.g., 00:00, 00:10, 00:20... 23:50)
  const labels = Array.from({ length: 144 }, (_, i) => {
    const totalMins = i * samplingRate;
    const hrs = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const mins = String(totalMins % 60).padStart(2, '0');
    return `${hrs}:${mins}`;
  });

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Peak dB',
        data: sampledPeak,
        borderColor: '#f43f5e', // rose-500
        backgroundColor: 'rgba(244, 63, 94, 0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.3
      },
      {
        label: 'Average dB',
        data: sampledAvg,
        borderColor: '#0ea5e9', // sky-500
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.3
      },
      {
        label: 'Limit Threshold',
        data: Array(144).fill(threshold),
        borderColor: 'rgba(239, 68, 68, 0.5)', // red-500
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8', // slate-400
          font: {
            family: 'Outfit',
            size: 11
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#475569',
        borderWidth: 1,
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'Outfit', size: 12 }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b', // slate-500
          font: { family: 'Outfit', size: 10 },
          maxTicksLimit: 12 // limit visible ticks on mobile screens
        }
      },
      y: {
        min: 30,
        max: 110,
        grid: {
          color: '#334155' // slate-700
        },
        ticks: {
          color: '#64748b',
          font: { family: 'Outfit', size: 10 }
        }
      }
    }
  };

  return (
    <div className="w-full h-80 relative">
      <Line data={data} options={options} />
    </div>
  );
};
