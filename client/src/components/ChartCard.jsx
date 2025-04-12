// src/components/ChartCard.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';



ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const ChartCard = ({ title, label, color, data }) => {
  const labels = data.map((d) => d.day);
  const totals = data.map((d) => d.total);

  const chartData = {
    labels,
    datasets: [
      {
        label: label || 'Montant (€)',
        data: totals,
        fill: true,
        borderColor: color || '#4bc0c0',
        backgroundColor: `${color || '#4bc0c0'}22`, // light transparent fill
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#0d0606',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${label || 'Montant'}: €${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#ccc',
        },
        grid: {
          display: false
        },
      },
      y: {
        ticks: {
          color: '#0d0606',
          callback: (val) => `€${val}`,
        },
        grid: {
          color: 'rgba(255,255,255,0.05)',
        },
      },
    },
  };

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ChartCard;
