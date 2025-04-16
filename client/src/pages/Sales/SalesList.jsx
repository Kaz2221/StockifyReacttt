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
  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="sales-table-container">
      {sales.length === 0 ? (
        <div className="no-data">Aucune vente enregistrée</div>
      ) : (
        <table className="sales-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Montant</th>
              <th>Paiement</th>
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
                  <td>{formatDate(sale.sale_date)}</td>
                  <td className="amount-cell">{Number(sale.total_amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
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
                      Modifier
                    </button>
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSale(sale.id);
                      }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>

                {selectedSaleId === sale.id && saleDetails.length > 0 && (
                  <tr className="sale-details-row">
                    <td colSpan="5">
                      <div className="sale-details">
                        <h4>Détails de la vente</h4>
                        <table className="sale-items-detail-table">
                          <thead>
                            <tr>
                              <th>Article</th>
                              <th>Quantité</th>
                              <th>Prix unitaire</th>
                              <th>Sous-total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {saleDetails.map((item) => (
                              <tr key={item.id}>
                                <td>{item.product_name}</td>
                                <td>{item.quantity}</td>
                                <td>{Number(item.unit_price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                                <td>{Number(item.quantity * item.unit_price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
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