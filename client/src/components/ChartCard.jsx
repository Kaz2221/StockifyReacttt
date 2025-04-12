// ChartCard.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, Tooltip, CategoryScale, LinearScale, PointElement, Legend } from 'chart.js';


ChartJS.register(LineElement, Tooltip, CategoryScale, LinearScale, PointElement, Legend);

const ChartCard = ({ title, label, data, color }) => {
  const chartData = {
    labels: data.map(d => d.label), // ["Apr 01", "Apr 02", ...]
    datasets: [{
      label,
      data: data.map(d => d.total), // [200.50, 0, 140.99, ...]
      borderColor: color,
      backgroundColor: color,
      fill: false,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#fff', // match your dark theme
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw.toFixed(2)} €`;
          },
        },
      },
      title: {
        display: true,
        text: title,
        color: '#fff',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#ccc',
        },
        grid: {
          color: 'rgba(255,255,255,0.1)',
        },
      },
      y: {
        ticks: {
          color: '#ccc',
          callback: (value) => `${value}€`,
        },
        grid: {
          color: 'rgba(255,255,255,0.1)',
        },
      },
    },
  };
  
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ChartCard;
