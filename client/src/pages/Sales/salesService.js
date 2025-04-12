import axios from 'axios';

const API = process.env.REACT_APP_API_URL;
console.log('🛠️ API Base URL:', API);


export const getSales = () =>
  axios.get(`${API}/api/sales`, { withCredentials: true });

export const getSaleItems = (saleId) =>
  axios.get(`${API}/api/sale_items/${saleId}`, { withCredentials: true });

export const createSale = (data) =>
  axios.post(`${API}/api/sales`, data, { withCredentials: true });

export const updateSale = (id, data) =>
  axios.put(`${API}/api/sales/${id}`, data, { withCredentials: true });

export const deleteSale = (id) =>
  axios.delete(`${API}/api/sales/${id}`, { withCredentials: true });

export const deleteSaleItems = (saleId) =>
  axios.delete(`${API}/api/sale_items/sale/${saleId}`, { withCredentials: true });

export const addSaleItem = (item) =>
  axios.post(`${API}/api/sale_items`, item, { withCredentials: true });

export const getInventoryItems = () =>
  axios.get(`${API}/api/items`, { withCredentials: true });
