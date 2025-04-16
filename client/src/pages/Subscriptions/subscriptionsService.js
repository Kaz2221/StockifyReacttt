import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

export const getSubscriptions = () =>
    axios.get(`${API}/api/subscriptions`, { withCredentials: true });

export const createSubscription = (subscription) =>
    axios.post(`${API}/api/subscriptions`, subscription, { withCredentials: true });

export const updateSubscription = (id, subscription) =>
    axios.put(`${API}/api/subscriptions/${id}`, subscription, { withCredentials: true });

export const deleteSubscription = (id) =>
    axios.delete(`${API}/api/subscriptions/${id}`, { withCredentials: true });