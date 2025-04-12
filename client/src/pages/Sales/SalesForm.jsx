import React from 'react';
import './Sales.css';

const SalesForm = ({
  formData,
  handleChange,
  saleItems,
  inventoryItems,
  addSaleItemRow,
  removeSaleItemRow,
  updateSaleItem,
  handleSubmit,
  modifyMode
}) => {
  return (
    <div className="sales-form-container">
      <form onSubmit={handleSubmit} className="sales-form">
        <h2>{modifyMode ? 'Edit Sale' : 'Add a New Sale'}</h2>

        <div className="form-row">
          <div className="form-group">
            <label>Total Amount</label>
            <input
              type="number"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              required
            >
              <option value="">Select Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="sale-items-section">
          <div className="sale-items-header">
            <h3>Sale Items</h3>
            <button type="button" className="add-item-button" onClick={addSaleItemRow}>
              + Add Item
            </button>
          </div>

          {saleItems.length === 0 ? (
            <div className="no-items">No items added yet.</div>
          ) : (
            <table className="sale-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {saleItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        value={item.item_id}
                        onChange={(e) => updateSaleItem(idx, 'item_id', e.target.value)}
                        required
                      >
                        <option value="">Select Item</option>
                        {inventoryItems.map((invItem) => (
                          <option key={invItem.id} value={invItem.id}>
                            {invItem.product_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateSaleItem(idx, 'quantity', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateSaleItem(idx, 'unit_price', e.target.value)}
                        required
                      />
                    </td>
                    <td>{(item.quantity * item.unit_price || 0).toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        className="remove-item-button"
                        onClick={() => removeSaleItemRow(idx)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="form-buttons">
          <button type="submit" className="save-button">
            {modifyMode ? 'Update Sale' : 'Save Sale'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesForm;
