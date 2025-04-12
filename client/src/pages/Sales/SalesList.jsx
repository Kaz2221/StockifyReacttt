import React from 'react';
import './Sales.css';

const SalesList = ({
  sales,
  handleEditSale,
  handleDeleteSale,
  selectedSaleId,
  saleDetails,
  handleSaleClick
}) => {
  return (
    <div className="sales-table-container">
      {sales.length === 0 ? (
        <div className="no-data">No sales yet.</div>
      ) : (
        <table className="sales-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Notes</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <React.Fragment key={sale.id}>
                <tr
                  className={selectedSaleId === sale.id ? 'selected-row' : ''}
                  onClick={() => handleSaleClick(sale.id)}
                >
                  <td>{sale.id}</td>
                  <td className="amount-cell">${Number(sale.total_amount).toFixed(2)}</td>
                  <td>{sale.payment_method}</td>
                  <td className="notes-cell">{sale.notes}</td>
                  <td className="actions-cell">
                    <button
                      className="edit-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSale(sale);
                      }}
                    >
                      Modify
                    </button>
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSale(sale.id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                {selectedSaleId === sale.id && saleDetails.length > 0 && (
                  <tr className="sale-details-row">
                    <td colSpan="5">
                      <div className="sale-details">
                        <h4>Sale Details</h4>
                        <table className="sale-items-detail-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Quantity</th>
                              <th>Unit Price</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {saleDetails.map((item) => (
                              <tr key={item.id}>
                                <td>{item.product_name}</td>
                                <td>{item.quantity}</td>
                                <td>${Number(item.unit_price).toFixed(2)}</td>
                                <td>${Number(item.quantity * item.unit_price).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SalesList;
