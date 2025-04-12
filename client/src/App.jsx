// client/src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Inventory from './pages/Inventory/Inventory';
import Expenses from './pages/Expenses/Expenses';
import Sales from './pages/Sales/Sales';
import PageTransition from './components/layout/PageTransition';
import Register from './pages/Register/Register';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <Layout>
          <PageTransition>
            <Dashboard />
          </PageTransition>
        </Layout>
      } />
      
      <Route path="/inventory" element={
        <Layout>
          <PageTransition>
            <Inventory />
          </PageTransition>
        </Layout>
      } />
      
      <Route path="/expenses" element={
        <Layout>
          <PageTransition>
            <Expenses />
          </PageTransition>
        </Layout>
      } />

      <Route path="/sales" element={
        <Layout>
          <PageTransition>
            <Sales />
          </PageTransition>
        </Layout>
      } />
    </Routes>
  );
}

export default App;