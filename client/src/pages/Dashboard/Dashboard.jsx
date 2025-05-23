// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getInventory, getSales, getExpenses, getSalesLast30Days, getInventoryCostLast30Days, getExpensesLast30Days, getRecentActivity } from './dashboardService'; 
import DashboardCard from '../../components/DashboardCard';
import ChartCard from '../../components/ChartCard';
import './Dashboard.css'; 

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesPerDay, setSalesPerDay] = useState([]);
  const [InventoryCostPerDay, setInventoryCostPerDay] = useState([]);
  const [expensesCostPerDay, setExpensesCostPerDay] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const navigate = useNavigate();

  // Function to format the time difference into a human-readable string
  // This function takes a timestamp and returns a string like "Il y a 2 heures"
  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) return "Il y a moins d'une heure";
    return `Il y a ${hours} ${hours === 1 ? 'heure' : 'heures'}`;
  };
  


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, salesRes, expensesRes] = await Promise.all([
          getInventory(),
          getSales(),
          getExpenses()
        ]);
  
        setInventoryCount(itemsRes.data.length);
  
        // 🧮 Filter sales for current month
        const thisMonth = new Date().getMonth();
        const monthlySalesTotal = salesRes.data
          .filter(s => new Date(s.sale_date).getMonth() === thisMonth)
          .reduce((sum, s) => sum + Number(s.total_amount), 0);
        setMonthlySales(monthlySalesTotal);
  
        const monthlyExpensesTotal = expensesRes.data
          .filter(e => new Date(e.expense_date).getMonth() === thisMonth)
          .reduce((sum, e) => sum + Number(e.amount), 0);
        setMonthlyExpenses(monthlyExpensesTotal);
      } catch (err) {
        console.error('Dashboard data error:', err);
      }
      
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    //Fetch sales chart data
    // This function fetches the sales data for the last 30 days and formats it for the chart
    const fetchSalesChartData = async () => {
      try {
        const res = await getSalesLast30Days();
        console.log("SAles CHART:",res.data);
        const data = res.data.map(entry => {
          const date = new Date(entry.day);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return {
            ...entry,
            day: `${month}-${day}` 
          };
        });
        
        setSalesPerDay(data);
      } catch (err) {
        console.error('Error fetching 30-day sales chart:', err);
        }
    };
    
    //Fetch inventory chart data
    // This function fetches the inventory data and formats it for the chart
    const fetchInventoryChartData = async () => {
    try{
      const res = await getInventoryCostLast30Days();
      console.log(res.data);
      const data = res.data.map(entry => {
        const date = new Date(entry.day);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return {
          ...entry,
          day: `${month}-${day}` 
        };
      });
      
      setInventoryCostPerDay(data);
    }catch(err){
      console.error('Error fetching inventory chart:', err);
      }
    }
    //Fetch expenses chart data
    // This function fetches the expenses data for the last 30 days and formats it for the chart
    const fetchExpensesChartData = async () => {
      try {
        const res = await getExpensesLast30Days();
        console.log("Expenses CHART:",res.data);
        const data = res.data.map(entry => {
          const date = new Date(entry.day);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return {
            ...entry,
            day: `${month}-${day}` 
          };
        });
        setExpensesCostPerDay(data);
      } catch (err) {
        console.error('Error fetching 30-day expenses chart:', err);
      }
    };

    const fetchRecentActivity = async () => {
      try {
        const res = await getRecentActivity();
        setRecentActivity(res.data);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
      }
    };
    
    fetchRecentActivity();
    fetchInventoryChartData();
    fetchSalesChartData();
    fetchExpensesChartData();
  }, []);

  return (
    <div className="dashboard-container">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Tableau de bord
      </motion.h1>

      <motion.div
        className="dashboard-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <DashboardCard
          title="Inventaire"
          delay={0.3}
          buttonText="Voir l'inventaire"
          onClick={() => navigate('/inventory')}
        >
          <p>Nombre total d'articles : {inventoryCount}</p>
        </DashboardCard>

        <DashboardCard
          title="Ventes"
          delay={0.4}
          buttonText="Voir les ventes"
          onClick={() => navigate('/sales')}
        >
          <p>Ventes du mois : {monthlySales.toFixed(2)} €</p>
        </DashboardCard>

        <DashboardCard
          title="Dépenses"
          delay={0.5}
          buttonText="Voir les dépenses"
          onClick={() => navigate('/expenses')}
        >
          <p>Dépenses du mois : {monthlyExpenses.toFixed(2)} €</p>
        </DashboardCard>


        <DashboardCard title="Activités récentes" delay={0.6}>
        <ul className="activity-list">
          {recentActivity.length === 0 ? (
            <li>Aucune activité récente</li>
          ) : (
            recentActivity.map((activity, i) => (
              <li key={i}>
                {activity.type} – {formatTimeAgo(activity.created_at)}
              </li>
            ))
          )}
        </ul>
      </DashboardCard>




      </motion.div>
        <div className="charts-grid">
            <div className="chart-container">
              <h3 className="chart-title">Inventory Value</h3>
              <div className="chart-card">
                <ChartCard
                  label="Achats (€)"
                  color="#007bff"
                  data={InventoryCostPerDay}
                />
              </div>
            </div>
            <div className="chart-container">
              <h3 className="chart-title">Expenses</h3>
              <div className="chart-card">
                <ChartCard
                  label="Ventes (€)"
                  color="#007bff"
                  data={expensesCostPerDay}
                />
              </div>
            </div>
            <div className="chart-container">
              <h3 className="chart-title">Ventes Mensuelles</h3>
              <div className="chart-card">
                <ChartCard
                  label="Ventes (€)"
                  color="#007bff"
                  data={salesPerDay}
                />
              </div>
            </div>
            
        </div>
    </div>
  );
}

export default Dashboard;
