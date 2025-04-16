import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

export const getInventory = () =>
  axios.get(`${API}/api/items`, { withCredentials: true });

export const getSales = () =>
  axios.get(`${API}/api/sales`, { withCredentials: true });

export const getExpenses = () =>
  axios.get(`${API}/api/expenses`, { withCredentials: true });

export const getSalesLast30Days = () =>
    axios.get(`${process.env.REACT_APP_API_URL}/api/sales-last-30-days`, {
      withCredentials: true,
    });

export const getInventoryCostLast30Days = () =>
    axios.get(`${process.env.REACT_APP_API_URL}/api/inventory-cost-last-30-days`, {
      withCredentials: true,
    });

    export const getExpensesLast30Days = () =>
    axios.get(`${process.env.REACT_APP_API_URL}/api/expenses-last-30-days`, {
      withCredentials: true,
    });

    export const getRecentActivity = () =>
    axios.get(`${process.env.REACT_APP_API_URL}/api/recent-activity`, {
      withCredentials: true,
    });