import React, { useEffect } from 'react';
import './Sales.css';

const SalesForm = ({
  formData,
  setFormData,  // Ajout de setFormData comme prop
  handleChange,
  saleItems,
  inventoryItems,
  addSaleItemRow,
  removeSaleItemRow,
  updateSaleItem,
  handleSubmit,
  handleCancel,
  modifyMode
}) => {
  // Calculer le montant total automatiquement
  useEffect(() => {
    const totalAmount = saleItems.reduce((sum, item) => {
      const subtotal = (item.quantity || 0) * (item.unit_price || 0);
      return sum + subtotal;
    }, 0);

    // Mettre à jour le formulaire avec le montant total calculé
    setFormData(prev => ({
      ...prev,
      total_amount: totalAmount.toFixed(2)
    }));
  }, [saleItems, setFormData]);

  return (
    <div className="sales-form-container">
      <form onSubmit={handleSubmit} className="sales-form">
        <h2>{modifyMode ? 'Modifier la vente' : 'Nouvelle vente'}</h2>

        <div className="form-row">
          <div className="form-group">
            <label>Montant total</label>
            <input
              type="number"
              name="total_amount"
              value={formData.total_amount}
              readOnly
              className="read-only-input"
            />
          </div>

          <div className="form-group">
            <label>Méthode de paiement</label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un mode de paiement</option>
              <option value="Cash">Espèces</option>
              <option value="Card">Carte</option>
              <option value="Bank Transfer">Virement</option>
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
            <h3>Articles de la vente</h3>
            <button 
              type="button" 
              className="add-item-button" 
              onClick={addSaleItemRow}
            >
              + Ajouter un article
            </button>
          </div>

          {saleItems.length === 0 ? (
            <div className="no-items">Aucun article ajouté</div>
          ) : (
            <table className="sale-items-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Sous-total</th>
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
                        <option value="">Sélectionner un article</option>
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
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="form-buttons">
          <button 
            type="button" 
            onClick={handleCancel} 
            className="cancel-button"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="save-button"
          >
            {modifyMode ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesForm;