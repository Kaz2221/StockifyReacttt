// src/pages/Sales/SalesPage.jsx
import React, { useState, useEffect } from 'react';
import './Sales.css';
import SalesForm from './SalesForm.jsx';
import SalesList from './SalesList.jsx';
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
  // These variables will hold the state of the form and the sale items
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
  const [saleBeingEdited, setSaleBeingEdited] = useState(null); // holds the full sale object


  
  const addSaleItemRow = () => {
    setSaleItems([...saleItems, { item_id: '', quantity: '', unit_price: '' }]);
  };
  
  const removeSaleItemRow = (index) => {
    const updatedItems = [...saleItems];
    updatedItems.splice(index, 1);
    setSaleItems(updatedItems);
  };
  


// Fetch items from the server when the component mounts
  // This function will set the itemsList state with the fetched data

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
  
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await  getInventoryItems();
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


  //HANDLER FUNCTIONS
    // This function will handle the form submission and send the data to the server
    const handleSubmit = async (e) => {
      e.preventDefault();
      setMessage(null);
      setError(null);
    
      try {
        let saleId;
    
        if (modifyMode && saleBeingEdited) {
          // ✅ UPDATE sale
          await updateSale(saleBeingEdited.id, formData);
    
          saleId = saleBeingEdited.id;
    
          // ❌ Delete old sale_items
          await deleteSaleItems(saleId);
        } else {
          // ✅ CREATE new sale
          const saleRes = await createSale(formData);
          saleId = saleRes.data.id;
        }
        // 2. (Re)Attach items
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
    
        // 3. Toast + reset
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
    
    

    // This function will handle the changes in the form inputs and update the state accordingly
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    // This function will handle the changes in the sale items inputs and update the state accordingly
    const handleItemChange = (index, field, value) => {
      const updatedItems = [...saleItems];
      updatedItems[index][field] = value;
      setSaleItems(updatedItems);
    };

    // This function will handle the click on a sale item and fetch its details
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
        <button className="add-button" onClick={() => setShowForm(prev => !prev)}>
          {showForm ? 'Cancel' : 'Add Sale'}
        </button>
      </div>
      {showForm && (
              <SalesForm
                formData={formData}
                handleChange={handleChange}
                saleItems={saleItems}
                inventoryItems={itemsList}
                addSaleItemRow={addSaleItemRow}
                removeSaleItemRow={removeSaleItemRow}
                updateSaleItem={handleItemChange}
                handleSubmit={handleSubmit}
                modifyMode={modifyMode}
              />
            )}
      {error && <div className="error-message">{error}</div>}
      <SalesList
            sales={sales}
            handleEditSale={handleEditSale}
            handleDeleteSale={handleDeleteSale}
            selectedSaleId={selectedSaleId}         // ✅ CORRECT!
            saleDetails={selectedSaleItems}
            handleSaleClick={handleSaleClick}
          />
            {message && (
              <div className={`toast-message ${fadingOut ? 'fade-out' : ''}`}>
                {message}
              </div>
            )}
          </div>
  );
};
export default Sales;
