// src/pages/Sales/Sales.jsx
import React, { useState, useEffect } from 'react';
import './Sales.css';
import SalesForm from './SalesForm.jsx';
import SalesList from './SalesList.jsx';
import Toast from '../../components/Toast';
import {
  getSales,
  getSaleItems,
  createSale,
  updateSale,
  deleteSale,
  deleteSaleItems,
  addSaleItem,
  getInventoryItems
} from './salesService';

const Sales = () => {
  //STATE VARIABLES
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    total_amount: '',
    payment_method: '',
    notes: ''
  });
  const [saleItems, setSaleItems] = useState([
    { item_id: '', quantity: '', unit_price: '' }
  ]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [itemsList, setItemsList] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemError, setItemError] = useState(null);
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [salesError, setSalesError] = useState(null);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [selectedSaleItems, setSelectedSaleItems] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [modifyMode, setModifyMode] = useState(false);
  const [saleBeingEdited, setSaleBeingEdited] = useState(null);

  // Add Sale Item Row
  const addSaleItemRow = () => {
    setSaleItems([...saleItems, { item_id: '', quantity: '', unit_price: '' }]);
  };
  
  // Remove Sale Item Row
  const removeSaleItemRow = (index) => {
    const updatedItems = [...saleItems];
    updatedItems.splice(index, 1);
    setSaleItems(updatedItems);
  };

  // Fetch Sales
  const fetchSales = async () => {
    try {
      const res = await getSales();
      setSales(res.data);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setSalesError('Failed to load sales');
    } finally {
      setLoadingSales(false);
    }
  };
  
  // Fetch Items and Sales on Component Mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await getInventoryItems();
        setItemsList(res.data);
      } catch (err) {
        console.error('Error fetching items:', err);
        setItemError('Could not load your items');
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
    fetchSales();
  }, []);

  // Handle Submit Sale
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
  
    try {
      let saleId;
  
      if (modifyMode && saleBeingEdited) {
        // UPDATE sale
        await updateSale(saleBeingEdited.id, formData);
  
        saleId = saleBeingEdited.id;
  
        // Delete old sale_items
        await deleteSaleItems(saleId);
      } else {
        // CREATE new sale
        const saleRes = await createSale(formData);
        saleId = saleRes.data.id;
      }
      // Attach items
      for (const item of saleItems) {
        if (item.item_id && item.quantity && item.unit_price) {
          await addSaleItem({
            sale_id: saleId,
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.quantity * item.unit_price
          });
        }
      }
  
      // Toast + reset
      setMessage(modifyMode ? 'Sale updated successfully!' : 'Sale + items added successfully!');
      setFadingOut(false);
      setTimeout(() => {
        setFadingOut(true);
        setTimeout(() => setMessage(null), 500);
      }, 2500);
  
      setShowForm(false);
      setFormData({ total_amount: '', payment_method: '', notes: '' });
      setSaleItems([{ item_id: '', quantity: '', unit_price: '' }]);
      setModifyMode(false);
      setSaleBeingEdited(null);
      fetchSales();
  
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };
  
  // Handle Form Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Form Cancel
  const handleCancel = () => {
    setFormData({ total_amount: '', payment_method: '', notes: '' });
    setSaleItems([{ item_id: '', quantity: '', unit_price: '' }]);
    setModifyMode(false);
    setSaleBeingEdited(null);
    setShowForm(false);
  };
  
  // Handle Sale Item Changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...saleItems];
    updatedItems[index][field] = value;
    setSaleItems(updatedItems);
  };

  // Handle Sale Item Click
  const handleSaleClick = async (saleId) => {
    console.log("🪵 Sale clicked with ID:", saleId);
    // Toggle off if clicked again
    if (selectedSaleId === saleId) {
      setSelectedSaleId(null);
      setSelectedSaleItems([]);
      return;
    }
  
    setSelectedSaleId(saleId);
    setLoadingDetails(true);
  
    try {
      const res = await getSaleItems(saleId);
      setSelectedSaleItems(res.data);
    } catch (err) {
      console.error('Error fetching sale items:', err);
      setSelectedSaleItems([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle Edit Sale
  const handleEditSale = async (sale) => {
    setFormData({
      total_amount: sale.total_amount,
      payment_method: sale.payment_method,
      notes: sale.notes
    });
  
    setModifyMode(true);
    setSaleBeingEdited(sale);
    setShowForm(true);
    try {
      const res = await getSaleItems(sale.id);
      const items = res.data.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));
      setSaleItems(items);
    } catch (err) {
      console.error('Error loading sale items for editing:', err);
      setError('Could not load sale items for editing');
    }
  };
  
  // Handle Delete Sale
  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) return;
  
    try {
      await deleteSale(saleId);
      //Avoid zombie sale items
      if (saleBeingEdited?.id === saleId) {
        // We're deleting the one currently being edited
        setShowForm(false);
        setModifyMode(false);
        setSaleBeingEdited(null);
        setFormData({ total_amount: '', payment_method: '', notes: '' });
        setSaleItems([{ item_id: '', quantity: '', unit_price: '' }]);
      }

      setSales(prev => prev.filter(sale => sale.id !== saleId));
      if (selectedSaleId === saleId) {
        setSelectedSaleId(null);
        setSelectedSaleItems([]);
      }
      setMessage('Sale deleted successfully!');
      setFadingOut(false);
      setTimeout(() => {
        setFadingOut(true); // start fade
        setTimeout(() => setMessage(null), 500); // remove from DOM
      }, 2500); // fade starts just before 3s
    } catch (err) {
      console.error('Failed to delete sale:', err);
      setError('Could not delete the sale.');
    }
  };

  return (
    <div className="sales-page">
      {loadingItems && <div className="loading">Loading your inventory...</div>}
      {itemError && <div className="error-message">{itemError}</div>}
      <div className="sales-header">
        <h1>Sales</h1>
        <button
          className="add-button"
          onClick={() => {
            if (showForm) {
              handleCancel(); //  Canceling: reset everything
            } else {
              setShowForm(true); //  Opening fresh form
            }
          }}
        >
          {showForm ? 'Cancel' : 'Add Sale'}
        </button>
      </div>
      {showForm && (
        <SalesForm
          formData={formData}
          setFormData={setFormData} 
          handleChange={handleChange}
          saleItems={saleItems}
          inventoryItems={itemsList}
          addSaleItemRow={addSaleItemRow}
          removeSaleItemRow={removeSaleItemRow}
          updateSaleItem={handleItemChange}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
          modifyMode={modifyMode}
        />
      )}
      {error && <div className="error-message">{error}</div>}
      <SalesList
        sales={sales}
        handleEditSale={handleEditSale}
        handleDeleteSale={handleDeleteSale}
        selectedSaleId={selectedSaleId}
        saleDetails={selectedSaleItems}
        handleSaleClick={handleSaleClick}
      />
      <Toast message={message} isError={error} fadingOut={fadingOut} />
    </div>
  );
};

export default Sales;