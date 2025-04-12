import pool from '../server.js'; // path depends on where the file is


export const getSalesItems = async (req, res) => {
    try {
        console.log("route hit")
        const userId = req.user.id;
    
            const result = await pool.query(`
              SELECT 
                si.id,
                si.sale_id,
                si.item_id,
                i.product_name,
                si.quantity,
                si.unit_price
              FROM sale_items si
              LEFT JOIN items i ON si.item_id = i.id
              INNER JOIN sales s ON si.sale_id = s.id
              WHERE s.user_id = $1
              ORDER BY si.sale_id, si.id
            `, [userId]);
    
        res.json(result.rows);
      } catch (error) {
        console.error('Erreur lors de la récupération des articles de vente:', error);
        res.status(500).json({ message: 'Erreur serveur' });
      }
}

export const getItemsForSale = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sale_id } = req.params;

    const result = await pool.query(`
      SELECT 
        si.id,
        si.item_id,
        i.product_name,
        si.quantity,
        si.unit_price,
        si.subtotal
      FROM sale_items si
      LEFT JOIN items i ON si.item_id = i.id
      INNER JOIN sales s ON si.sale_id = s.id
      WHERE s.user_id = $1 AND s.id = $2
      ORDER BY si.id
    `, [userId, sale_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sale item details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



export const addSaleItem = async (req, res) => {
    const client = await pool.connect();
  
    try {
      await client.query('BEGIN');
      
      const { sale_id, item_id, quantity, unit_price } = req.body;
      
      // Convertir les paramètres en types appropriés
      const numItemId = Number(item_id);
      const numQuantity = Number(quantity);
      const numSaleId = Number(sale_id);
      const numUnitPrice = Number(unit_price);
      console.log(`Ajout d'un article de vente: ${numItemId}, ${numQuantity}, ${numSaleId},${numUnitPrice}`);
      // Vérifier que l'article existe et récupérer des informations
      const itemCheck = await client.query(
        'SELECT qty, product_name, min_qty FROM items WHERE id = $1',
        [numItemId]
      );
      
      if (itemCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Article non trouvé' });
      }
      
      const currentStock = itemCheck.rows[0].qty;
      const product_name = itemCheck.rows[0].product_name;
      const minQty = itemCheck.rows[0].min_qty || 0; // Quantité minimale, 0 par défaut
      
      // Vérifier si le stock est suffisant
      if (currentStock < numQuantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: `Stock insuffisant. Stock actuel: ${currentStock}, Quantité demandée: ${numQuantity}` 
        });
      }
      
      // Calculer la quantité qui restera après la vente
      const remainingQty = currentStock - numQuantity;
      
      // Flag pour indiquer si le stock passe en dessous du seuil minimal
      let lowStockAlert = false;
      
      // Vérifier si le stock va passer en dessous du seuil minimal
      if (remainingQty <= minQty) {
        lowStockAlert = true;
        console.log(`ALERTE: Le stock de ${product_name} va passer en dessous du seuil minimal (${minQty}). Stock restant: ${remainingQty}`);
      }
      
      // Calculer le sous-total
      const subtotal = numQuantity * numUnitPrice;
      
      // Insérer l'article de vente
      const result = await client.query(
        `INSERT INTO sale_items 
         (sale_id, item_id, quantity, unit_price, product_name, subtotal) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [numSaleId, numItemId, numQuantity, numUnitPrice, product_name, subtotal]
      );
      
      // Mettre à jour la quantité en stock
      console.log(`Mise à jour du stock: Réduire la quantité de ${numQuantity} pour l'article ${numItemId}`);
      
      const updateStock = await client.query(
        `UPDATE items 
         SET qty = qty - $1 
         WHERE id = $2
         RETURNING qty as new_stock`,
        [numQuantity, numItemId]
      );
      
      console.log(`Nouveau stock après mise à jour: ${updateStock.rows[0].new_stock}`);
      
      await client.query('COMMIT');
      
      // Ajouter l'alerte à la réponse si nécessaire
      const response = {
        ...result.rows[0],
        lowStockAlert: lowStockAlert,
        message: lowStockAlert ? `Attention: Le stock de ${product_name} est bas (${remainingQty}/${minQty})` : null
      };
      
      res.status(201).json(response);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur lors de l\'ajout d\'un article de vente:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    } finally {
      client.release();
    }
}


export const updateSaleItem = async (req, res) => {
    const { id } = req.params;
    const { payment_method, notes, total_amount } = req.body;
  
    try {
      const result = await pool.query(
        `UPDATE sales 
         SET payment_method = $1, 
             notes = $2,
             total_amount = $3
         WHERE id = $4 AND user_id = $5
         RETURNING id, payment_method, notes, total_amount, sale_date`,
        [payment_method, notes, total_amount, id, req.user.id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Vente non trouvée ou non autorisée" });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la vente:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }

}

export const deleteSaleItem = async (req, res) => {
    const client = await pool.connect();
  
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const numId = Number(id);
      
      // Récupérer l'article de vente pour restaurer le stock
      const saleItem = await client.query(
        'SELECT item_id, quantity FROM sale_items WHERE id = $1',
        [numId]
      );
      
      if (saleItem.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Article de vente non trouvé' });
      }
      
      const numItemId = Number(saleItem.rows[0].item_id);
      const numQuantity = Number(saleItem.rows[0].quantity);
      
      // Restaurer le stock
      console.log(`Restauration du stock pour l'article ${numItemId}: +${numQuantity}`);
      
      await client.query(
        `UPDATE items 
         SET qty = qty + $1 
         WHERE id = $2
         RETURNING qty as new_stock`,
        [numQuantity, numItemId]
      );
      
      // Supprimer l'article de vente
      const result = await client.query(
        'DELETE FROM sale_items WHERE id = $1 RETURNING *',
        [numId]
      );
      
      await client.query('COMMIT');
      res.json({ message: 'Article de vente supprimé avec succès' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur lors de la suppression d\'un article de vente:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    } finally {
      client.release();
    }

    
}

export const deleteSaleItemsBySaleId = async (req, res) => {
  const { sale_id } = req.params;

  try {
    await pool.query('DELETE FROM sale_items WHERE sale_id = $1', [sale_id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting sale items by sale ID:', err);
    res.status(500).json({ message: 'Server error deleting sale items' });
  }
};
